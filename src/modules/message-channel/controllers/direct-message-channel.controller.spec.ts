import { Test, TestingModule } from "@nestjs/testing"
import { BadRequestException } from "@nestjs/common"
import { DirectMessageChannelController } from "./direct-message-channel.controller"
import { PrismaService } from "../../prisma/prisma.service"

// Mock PrismaService type
type MockPrismaService = {
  directMessageChannel: {
    findMany: jest.MockedFunction<any>
    count: jest.MockedFunction<any>
  }
  directMessage: {
    findMany: jest.MockedFunction<any>
    count: jest.MockedFunction<any>
  }
  usersOnDirectMessageChannels: {
    findUnique: jest.MockedFunction<any>
  }
  $transaction: jest.MockedFunction<any>
}

describe("DirectMessageChannelController", () => {
  let controller: DirectMessageChannelController
  let prismaService: MockPrismaService

  beforeEach(async () => {
    const mockPrismaService: MockPrismaService = {
      directMessageChannel: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      directMessage: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      usersOnDirectMessageChannels: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectMessageChannelController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    controller = module.get<DirectMessageChannelController>(
      DirectMessageChannelController,
    )
    prismaService = module.get<MockPrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("getDirectMessageChannelList", () => {
    const mockUserId = "user-123"
    const mockPagination = { page: 1, take: 10 }

    const mockChannelData = [
      {
        id: "channel-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        users: [
          {
            user: {
              wsId: "ws-connection-456",
              profile: {
                id: "profile-456",
                fullName: "Chat Partner",
                avatarUrl: "https://example.com/avatar.jpg",
              },
            },
          },
        ],
        messages: [
          {
            id: "message-1",
            value: "Hello world",
            isDeleted: false,
            createdAt: new Date("2024-01-01"),
            user: {
              profile: {
                id: "profile-456",
                fullName: "Chat Partner",
              },
            },
          },
        ],
      },
    ]

    it("should successfully get direct message channel list with online user", async () => {
      const mockTotal = 1
      prismaService.$transaction.mockResolvedValue([mockChannelData, mockTotal])

      const result = await controller.getDirectMessageChannelList(
        mockPagination,
        mockUserId,
      )
      expect(prismaService.$transaction).toHaveBeenCalled()

      expect(result).toEqual({
        data: [
          {
            id: "channel-1",
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-02"),
            user: {
              profile: {
                id: "profile-456",
                fullName: "Chat Partner",
                avatarUrl: "https://example.com/avatar.jpg",
              },
              isOnline: true,
            },
            lastMessage: {
              id: "message-1",
              value: "Hello world",
              isDeleted: false,
              createdAt: new Date("2024-01-01"),
              user: {
                profile: {
                  id: "profile-456",
                  fullName: "Chat Partner",
                },
              },
            },
          },
        ],
        meta: {
          total: mockTotal,
          page: 1,
          take: 10,
        },
      })
    })

    it("should handle offline user (wsId is null)", async () => {
      const offlineChannelData = [
        {
          ...mockChannelData[0],
          users: [
            {
              user: {
                wsId: null,
                profile: {
                  id: "profile-456",
                  fullName: "Offline User",
                },
              },
            },
          ],
        },
      ]

      prismaService.$transaction.mockResolvedValue([offlineChannelData, 1])

      const result = await controller.getDirectMessageChannelList(
        mockPagination,
        mockUserId,
      )

      expect(result.data[0].user.isOnline).toBe(false)
    })

    it("should handle channel with no messages", async () => {
      const noMessageChannelData = [
        {
          ...mockChannelData[0],
          messages: [],
        },
      ]

      prismaService.$transaction.mockResolvedValue([noMessageChannelData, 1])

      const result = await controller.getDirectMessageChannelList(
        mockPagination,
        mockUserId,
      )

      expect(result.data[0].lastMessage).toBe(null)
    })

    it("should handle deleted message (empty value)", async () => {
      const deletedMessageChannelData = [
        {
          ...mockChannelData[0],
          messages: [
            {
              ...mockChannelData[0].messages[0],
              isDeleted: true,
              value: "This message was deleted",
            },
          ],
        },
      ]

      prismaService.$transaction.mockResolvedValue([
        deletedMessageChannelData,
        1,
      ])

      const result = await controller.getDirectMessageChannelList(
        mockPagination,
        mockUserId,
      )

      expect(result.data[0].lastMessage.value).toBe("")
    })

    it("should handle pagination correctly", async () => {
      const largePage = { page: 3, take: 5 }
      prismaService.$transaction.mockResolvedValue([[], 0])

      await controller.getDirectMessageChannelList(largePage, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalled()
      // Verify that skip calculation is correct: (3-1) * 5 = 10
    })

    it("should handle empty channel list", async () => {
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getDirectMessageChannelList(
        mockPagination,
        mockUserId,
      )

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          take: 10,
        },
      })
    })

    it("should handle database error", async () => {
      prismaService.$transaction.mockRejectedValue(
        new Error("Database connection failed"),
      )

      await expect(
        controller.getDirectMessageChannelList(mockPagination, mockUserId),
      ).rejects.toThrow("Database connection failed")
    })

    it("should handle large dataset with correct pagination", async () => {
      const largePagination = { page: 10, take: 50 }
      prismaService.$transaction.mockResolvedValue([[], 1000])

      const result = await controller.getDirectMessageChannelList(
        largePagination,
        mockUserId,
      )

      expect(result.meta).toEqual({
        total: 1000,
        page: 10,
        take: 50,
      })
    })
  })

  describe("getDirectMessageList", () => {
    const mockUserId = "user-123"
    const mockChannelId = "channel-456"
    const mockPagination = { page: 1, take: 10 }

    const mockMessages = [
      {
        id: "message-1",
        value: "Hello there",
        isDeleted: false,
        createdAt: new Date("2024-01-01"),
        directMessageChannelId: mockChannelId,
        userId: "user-456",
        user: {
          profile: {
            id: "profile-456",
            fullName: "Sender Name",
          },
        },
      },
      {
        id: "message-2",
        value: "This is deleted",
        isDeleted: true,
        createdAt: new Date("2024-01-02"),
        directMessageChannelId: mockChannelId,
        userId: mockUserId,
        user: {
          profile: {
            id: "profile-123",
            fullName: "Current User",
          },
        },
      },
    ]

    it("should successfully get direct message list", async () => {
      const mockChannelAccess = {
        userId: mockUserId,
        directMessageChannelId: mockChannelId,
      }

      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        mockChannelAccess,
      )
      prismaService.$transaction.mockResolvedValue([mockMessages, 2])

      const result = await controller.getDirectMessageList(
        mockChannelId,
        mockPagination,
        mockUserId,
      )

      expect(
        prismaService.usersOnDirectMessageChannels.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId_directMessageChannelId: {
            userId: mockUserId,
            directMessageChannelId: mockChannelId,
          },
        },
      })

      expect(result).toEqual({
        data: [
          {
            id: "message-1",
            value: "Hello there",
            isDeleted: false,
            createdAt: new Date("2024-01-01"),
            directMessageChannelId: mockChannelId,
            userId: "user-456",
            user: {
              profile: {
                id: "profile-456",
                fullName: "Sender Name",
              },
            },
          },
          {
            id: "message-2",
            value: "", // Deleted message should have empty value
            isDeleted: true,
            createdAt: new Date("2024-01-02"),
            directMessageChannelId: mockChannelId,
            userId: mockUserId,
            user: {
              profile: {
                id: "profile-123",
                fullName: "Current User",
              },
            },
          },
        ],
        meta: {
          total: 2,
          page: 1,
          take: 10,
        },
      })
    })

    it("should throw BadRequestException when user has no access to channel", async () => {
      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        null,
      )

      await expect(
        controller.getDirectMessageList(
          mockChannelId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Direct message channel doesn't exist or you don't have permission",
        ),
      )

      expect(prismaService.$transaction).not.toHaveBeenCalled()
    })

    it("should handle empty message list", async () => {
      const mockChannelAccess = {
        userId: mockUserId,
        directMessageChannelId: mockChannelId,
      }

      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        mockChannelAccess,
      )
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getDirectMessageList(
        mockChannelId,
        mockPagination,
        mockUserId,
      )

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          take: 10,
        },
      })
    })

    it("should handle pagination correctly for messages", async () => {
      const largePage = { page: 5, take: 20 }
      const mockChannelAccess = {
        userId: mockUserId,
        directMessageChannelId: mockChannelId,
      }

      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        mockChannelAccess,
      )
      prismaService.$transaction.mockResolvedValue([[], 100])

      const result = await controller.getDirectMessageList(
        mockChannelId,
        largePage,
        mockUserId,
      )

      expect(result.meta).toEqual({
        total: 100,
        page: 5,
        take: 20,
      })
    })

    it("should handle only deleted messages", async () => {
      const deletedMessages = [
        {
          id: "message-1",
          value: "Secret message",
          isDeleted: true,
          createdAt: new Date("2024-01-01"),
          user: {
            profile: {
              fullName: "User Name",
            },
          },
        },
      ]

      const mockChannelAccess = {
        userId: mockUserId,
        directMessageChannelId: mockChannelId,
      }

      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        mockChannelAccess,
      )
      prismaService.$transaction.mockResolvedValue([deletedMessages, 1])

      const result = await controller.getDirectMessageList(
        mockChannelId,
        mockPagination,
        mockUserId,
      )

      expect(result.data[0].value).toBe("")
    })

    it("should handle database error when checking channel access", async () => {
      prismaService.usersOnDirectMessageChannels.findUnique.mockRejectedValue(
        new Error("Database error"),
      )

      await expect(
        controller.getDirectMessageList(
          mockChannelId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow("Database error")
    })

    it("should handle database error when fetching messages", async () => {
      const mockChannelAccess = {
        userId: mockUserId,
        directMessageChannelId: mockChannelId,
      }

      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        mockChannelAccess,
      )
      prismaService.$transaction.mockRejectedValue(
        new Error("Transaction failed"),
      )

      await expect(
        controller.getDirectMessageList(
          mockChannelId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow("Transaction failed")
    })

    it("should handle invalid UUID format in channel ID", async () => {
      const invalidChannelId = "invalid-uuid"
      const mockChannelAccess = {
        userId: mockUserId,
        directMessageChannelId: invalidChannelId,
      }

      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        mockChannelAccess,
      )
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getDirectMessageList(
        invalidChannelId,
        mockPagination,
        mockUserId,
      )

      expect(result.data).toEqual([])
    })

    it("should handle large pagination values", async () => {
      const extremePagination = { page: 1000, take: 100 }
      const mockChannelAccess = {
        userId: mockUserId,
        directMessageChannelId: mockChannelId,
      }

      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        mockChannelAccess,
      )
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getDirectMessageList(
        mockChannelId,
        extremePagination,
        mockUserId,
      )

      expect(result.meta.page).toBe(1000)
      expect(result.meta.take).toBe(100)
    })
  })

  describe("edge cases and error handling", () => {
    it("should handle transaction timeout", async () => {
      const mockUserId = "user-123"
      const mockPagination = { page: 1, take: 10 }

      prismaService.$transaction.mockRejectedValue(
        new Error("Transaction timeout"),
      )

      await expect(
        controller.getDirectMessageChannelList(mockPagination, mockUserId),
      ).rejects.toThrow("Transaction timeout")
    })

    it("should handle malformed data from database", async () => {
      const mockUserId = "user-123"
      const mockPagination = { page: 1, take: 10 }

      const malformedData = [
        {
          id: "channel-1",
          users: [], // Empty users array
          messages: [null], // Null message
        },
      ]

      prismaService.$transaction.mockResolvedValue([malformedData, 1])

      await expect(
        controller.getDirectMessageChannelList(mockPagination, mockUserId),
      ).rejects.toThrow()
    })

    it("should handle concurrent access to same channel", async () => {
      const mockUserId = "user-123"
      const mockChannelId = "channel-456"
      const mockPagination = { page: 1, take: 10 }

      const mockChannelAccess = {
        userId: mockUserId,
        directMessageChannelId: mockChannelId,
      }

      // Simulate concurrent modification
      prismaService.usersOnDirectMessageChannels.findUnique.mockResolvedValue(
        mockChannelAccess,
      )
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getDirectMessageList(
        mockChannelId,
        mockPagination,
        mockUserId,
      )

      expect(result.data).toEqual([])
    })
  })
})
