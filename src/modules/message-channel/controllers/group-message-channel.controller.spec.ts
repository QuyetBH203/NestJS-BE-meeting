import { Test, TestingModule } from "@nestjs/testing"
import { BadRequestException } from "@nestjs/common"
import { GroupMessageChannelController } from "./group-message-channel.controller"
import { PrismaService } from "src/modules/prisma/prisma.service"
import { CreateGroupMessageChannelDto } from "../dto/create-group-message-channel.dto"
import { UpdateGroupMessageChannelDto } from "../dto/update-group-message-channel.dto"

// Mock PrismaService type
type MockPrismaService = {
  group: {
    findUnique: jest.MockedFunction<any>
  }
  usersOnGroups: {
    findUnique: jest.MockedFunction<any>
  }
  groupMessageChannel: {
    create: jest.MockedFunction<any>
    findMany: jest.MockedFunction<any>
    findUnique: jest.MockedFunction<any>
    count: jest.MockedFunction<any>
    update: jest.MockedFunction<any>
  }
  groupMessage: {
    findMany: jest.MockedFunction<any>
    count: jest.MockedFunction<any>
  }
  $transaction: jest.MockedFunction<any>
}

describe("GroupMessageChannelController", () => {
  let controller: GroupMessageChannelController
  let prismaService: MockPrismaService

  beforeEach(async () => {
    const mockPrismaService: MockPrismaService = {
      group: {
        findUnique: jest.fn(),
      },
      usersOnGroups: {
        findUnique: jest.fn(),
      },
      groupMessageChannel: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      groupMessage: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupMessageChannelController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    controller = module.get<GroupMessageChannelController>(
      GroupMessageChannelController,
    )
    prismaService = module.get<MockPrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createGroupMessageChannel", () => {
    const mockUserId = "user-123"
    const mockGroupId = "group-456"
    const createDto: CreateGroupMessageChannelDto = { name: "General Chat" }

    it("should successfully create group message channel", async () => {
      const mockGroup = {
        id: mockGroupId,
        ownerId: mockUserId,
        name: "Test Group",
      }

      const mockCreatedChannel = {
        id: "channel-789",
        groupId: mockGroupId,
        name: "General Chat",
        isDeleted: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      }

      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.groupMessageChannel.create.mockResolvedValue(
        mockCreatedChannel,
      )

      const result = await controller.createGroupMessageChannel(
        mockGroupId,
        createDto,
        mockUserId,
      )

      expect(prismaService.group.findUnique).toHaveBeenCalledWith({
        where: { id: mockGroupId },
      })

      expect(prismaService.groupMessageChannel.create).toHaveBeenCalledWith({
        data: {
          groupId: mockGroupId,
          name: "General Chat",
        },
      })

      expect(result).toEqual(mockCreatedChannel)
    })

    it("should throw BadRequestException when group does not exist", async () => {
      prismaService.group.findUnique.mockResolvedValue(null)

      await expect(
        controller.createGroupMessageChannel(
          mockGroupId,
          createDto,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )

      expect(prismaService.groupMessageChannel.create).not.toHaveBeenCalled()
    })

    it("should throw BadRequestException when user is not group owner", async () => {
      const mockGroup = {
        id: mockGroupId,
        ownerId: "different-user-456",
        name: "Test Group",
      }

      prismaService.group.findUnique.mockResolvedValue(mockGroup)

      await expect(
        controller.createGroupMessageChannel(
          mockGroupId,
          createDto,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )

      expect(prismaService.groupMessageChannel.create).not.toHaveBeenCalled()
    })

    it("should handle database error during group lookup", async () => {
      prismaService.group.findUnique.mockRejectedValue(
        new Error("Database error"),
      )

      await expect(
        controller.createGroupMessageChannel(
          mockGroupId,
          createDto,
          mockUserId,
        ),
      ).rejects.toThrow("Database error")
    })

    it("should handle database error during channel creation", async () => {
      const mockGroup = {
        id: mockGroupId,
        ownerId: mockUserId,
        name: "Test Group",
      }

      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.groupMessageChannel.create.mockRejectedValue(
        new Error("Creation failed"),
      )

      await expect(
        controller.createGroupMessageChannel(
          mockGroupId,
          createDto,
          mockUserId,
        ),
      ).rejects.toThrow("Creation failed")
    })
  })

  describe("getGroupMessageChannelList", () => {
    const mockUserId = "user-123"
    const mockGroupId = "group-456"
    const mockPagination = { page: 1, take: 10 }

    const mockChannels = [
      {
        id: "channel-1",
        groupId: mockGroupId,
        name: "General",
        isDeleted: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        messages: [
          {
            id: "message-1",
            value: "Hello everyone",
            isDeleted: false,
            createdAt: new Date("2024-01-01"),
            user: {
              profile: {
                id: "profile-123",
                fullName: "John Doe",
              },
            },
          },
        ],
      },
      {
        id: "channel-2",
        groupId: mockGroupId,
        name: "Random",
        isDeleted: false,
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
        messages: [],
      },
    ]

    it("should successfully get group message channel list", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: false,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.$transaction.mockResolvedValue([mockChannels, 2])

      const result = await controller.getGroupMessageChannelList(
        mockGroupId,
        mockPagination,
        mockUserId,
      )

      expect(prismaService.usersOnGroups.findUnique).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            userId: mockUserId,
            groupId: mockGroupId,
          },
        },
      })

      expect(result).toEqual({
        data: [
          {
            id: "channel-1",
            groupId: mockGroupId,
            name: "General",
            isDeleted: false,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
            lastMessage: {
              id: "message-1",
              value: "Hello everyone",
              isDeleted: false,
              createdAt: new Date("2024-01-01"),
              user: {
                profile: {
                  id: "profile-123",
                  fullName: "John Doe",
                },
              },
            },
          },
          {
            id: "channel-2",
            groupId: mockGroupId,
            name: "Random",
            isDeleted: false,
            createdAt: new Date("2024-01-02"),
            updatedAt: new Date("2024-01-02"),
            lastMessage: null,
          },
        ],
        meta: {
          total: 2,
          page: 1,
          take: 10,
        },
      })
    })

    it("should handle deleted message in last message", async () => {
      const channelsWithDeletedMessage = [
        {
          ...mockChannels[0],
          messages: [
            {
              id: "message-1",
              value: "This was deleted",
              isDeleted: true,
              createdAt: new Date("2024-01-01"),
              user: {
                profile: {
                  fullName: "John Doe",
                },
              },
            },
          ],
        },
      ]

      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: false,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.$transaction.mockResolvedValue([
        channelsWithDeletedMessage,
        1,
      ])

      const result = await controller.getGroupMessageChannelList(
        mockGroupId,
        mockPagination,
        mockUserId,
      )

      expect(result.data[0].lastMessage.value).toBe("")
    })

    it("should throw BadRequestException when user has no access to group", async () => {
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.getGroupMessageChannelList(
          mockGroupId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )

      expect(prismaService.$transaction).not.toHaveBeenCalled()
    })

    it("should handle pagination correctly", async () => {
      const largePage = { page: 3, take: 5 }
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getGroupMessageChannelList(
        mockGroupId,
        largePage,
        mockUserId,
      )

      expect(result.meta).toEqual({
        total: 0,
        page: 3,
        take: 5,
      })
    })

    it("should handle empty channel list", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getGroupMessageChannelList(
        mockGroupId,
        mockPagination,
        mockUserId,
      )

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it("should handle database error", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.$transaction.mockRejectedValue(new Error("Database error"))

      await expect(
        controller.getGroupMessageChannelList(
          mockGroupId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow("Database error")
    })
  })

  describe("getGroupMessageChannel", () => {
    const mockUserId = "user-123"
    const mockGroupId = "group-456"
    const mockChannelId = "channel-789"

    it("should successfully get group message channel", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "General",
        isDeleted: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )

      const result = await controller.getGroupMessageChannel(
        mockGroupId,
        mockChannelId,
        mockUserId,
      )

      expect(prismaService.usersOnGroups.findUnique).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            userId: mockUserId,
            groupId: mockGroupId,
          },
        },
      })

      expect(prismaService.groupMessageChannel.findUnique).toHaveBeenCalledWith(
        {
          where: {
            id: mockChannelId,
            groupId: mockGroupId,
          },
        },
      )

      expect(result).toEqual(mockChannel)
    })

    it("should throw BadRequestException when user has no access to group", async () => {
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.getGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )

      expect(
        prismaService.groupMessageChannel.findUnique,
      ).not.toHaveBeenCalled()
    })

    it("should throw BadRequestException when channel does not exist", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(null)

      await expect(
        controller.getGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group message channel doesn't exist or you don't have permission",
        ),
      )
    })

    it("should handle database error during group access check", async () => {
      prismaService.usersOnGroups.findUnique.mockRejectedValue(
        new Error("Database error"),
      )

      await expect(
        controller.getGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          mockUserId,
        ),
      ).rejects.toThrow("Database error")
    })

    it("should handle database error during channel lookup", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockRejectedValue(
        new Error("Database error"),
      )

      await expect(
        controller.getGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          mockUserId,
        ),
      ).rejects.toThrow("Database error")
    })
  })

  describe("updateGroupMessageChannel", () => {
    const mockUserId = "user-123"
    const mockGroupId = "group-456"
    const mockChannelId = "channel-789"
    const updateDto: UpdateGroupMessageChannelDto = { name: "Updated Channel" }

    it("should successfully update group message channel", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: true,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "Old Name",
        isDeleted: false,
      }

      const mockUpdatedChannel = {
        ...mockChannel,
        name: "Updated Channel",
        updatedAt: new Date("2024-01-02"),
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.groupMessageChannel.update.mockResolvedValue(
        mockUpdatedChannel,
      )

      const result = await controller.updateGroupMessageChannel(
        mockGroupId,
        mockChannelId,
        updateDto,
        mockUserId,
      )

      expect(prismaService.groupMessageChannel.update).toHaveBeenCalledWith({
        where: { id: mockChannelId },
        data: updateDto,
      })

      expect(result).toEqual(mockUpdatedChannel)
    })

    it("should throw BadRequestException when user is not group owner", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: false,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)

      await expect(
        controller.updateGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          updateDto,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )

      expect(
        prismaService.groupMessageChannel.findUnique,
      ).not.toHaveBeenCalled()
    })

    it("should throw BadRequestException when group access is null", async () => {
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.updateGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          updateDto,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )
    })

    it("should throw BadRequestException when channel does not exist", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: true,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(null)

      await expect(
        controller.updateGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          updateDto,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group message channel doesn't exist or you don't have permission",
        ),
      )

      expect(prismaService.groupMessageChannel.update).not.toHaveBeenCalled()
    })

    it("should handle database error during update", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: true,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "Old Name",
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.groupMessageChannel.update.mockRejectedValue(
        new Error("Update failed"),
      )

      await expect(
        controller.updateGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          updateDto,
          mockUserId,
        ),
      ).rejects.toThrow("Update failed")
    })
  })

  describe("deleteGroupMessageChannel", () => {
    const mockUserId = "user-123"
    const mockGroupId = "group-456"
    const mockChannelId = "channel-789"

    it("should successfully delete group message channel (soft delete)", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: true,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "Channel to Delete",
        isDeleted: false,
      }

      const mockDeletedChannel = {
        ...mockChannel,
        isDeleted: true,
        updatedAt: new Date("2024-01-02"),
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.groupMessageChannel.update.mockResolvedValue(
        mockDeletedChannel,
      )

      const result = await controller.deleteGroupMessageChannel(
        mockGroupId,
        mockChannelId,
        mockUserId,
      )

      expect(prismaService.groupMessageChannel.update).toHaveBeenCalledWith({
        where: { id: mockChannelId },
        data: { isDeleted: true },
      })

      expect(result).toEqual(mockDeletedChannel)
    })

    it("should throw BadRequestException when user is not group owner", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: false,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)

      await expect(
        controller.deleteGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )

      expect(
        prismaService.groupMessageChannel.findUnique,
      ).not.toHaveBeenCalled()
    })

    it("should throw BadRequestException when group access is null", async () => {
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.deleteGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )
    })

    it("should throw BadRequestException when channel does not exist", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: true,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(null)

      await expect(
        controller.deleteGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group message channel doesn't exist or you don't have permission",
        ),
      )

      expect(prismaService.groupMessageChannel.update).not.toHaveBeenCalled()
    })

    it("should handle database error during deletion", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: true,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "Channel to Delete",
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.groupMessageChannel.update.mockRejectedValue(
        new Error("Delete failed"),
      )

      await expect(
        controller.deleteGroupMessageChannel(
          mockGroupId,
          mockChannelId,
          mockUserId,
        ),
      ).rejects.toThrow("Delete failed")
    })
  })

  describe("getGroupMessageList", () => {
    const mockUserId = "user-123"
    const mockGroupId = "group-456"
    const mockChannelId = "channel-789"
    const mockPagination = { page: 1, take: 10 }

    const mockMessages = [
      {
        id: "message-1",
        value: "Hello group!",
        isDeleted: false,
        createdAt: new Date("2024-01-01"),
        groupMessageChannelId: mockChannelId,
        userId: "user-456",
        user: {
          profile: {
            id: "profile-456",
            fullName: "Jane Doe",
          },
        },
      },
      {
        id: "message-2",
        value: "This message was deleted",
        isDeleted: true,
        createdAt: new Date("2024-01-02"),
        groupMessageChannelId: mockChannelId,
        userId: mockUserId,
        user: {
          profile: {
            id: "profile-123",
            fullName: "John Doe",
          },
        },
      },
    ]

    it("should successfully get group message list", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "General",
        isDeleted: false,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.$transaction.mockResolvedValue([mockMessages, 2])

      const result = await controller.getGroupMessageList(
        mockGroupId,
        mockChannelId,
        mockPagination,
        mockUserId,
      )

      expect(result).toEqual({
        data: [
          {
            id: "message-1",
            value: "Hello group!",
            isDeleted: false,
            createdAt: new Date("2024-01-01"),
            groupMessageChannelId: mockChannelId,
            userId: "user-456",
            user: {
              profile: {
                id: "profile-456",
                fullName: "Jane Doe",
              },
            },
          },
          {
            id: "message-2",
            value: "", // Deleted message should have empty value
            isDeleted: true,
            createdAt: new Date("2024-01-02"),
            groupMessageChannelId: mockChannelId,
            userId: mockUserId,
            user: {
              profile: {
                id: "profile-123",
                fullName: "John Doe",
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

    it("should throw BadRequestException when user has no access to group", async () => {
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.getGroupMessageList(
          mockGroupId,
          mockChannelId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission",
        ),
      )

      expect(
        prismaService.groupMessageChannel.findUnique,
      ).not.toHaveBeenCalled()
    })

    it("should throw BadRequestException when channel does not exist", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(null)

      await expect(
        controller.getGroupMessageList(
          mockGroupId,
          mockChannelId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          "Group message channel doesn't exist or you don't have permission",
        ),
      )

      expect(prismaService.$transaction).not.toHaveBeenCalled()
    })

    it("should handle empty message list", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "General",
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getGroupMessageList(
        mockGroupId,
        mockChannelId,
        mockPagination,
        mockUserId,
      )

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it("should handle pagination correctly", async () => {
      const largePage = { page: 5, take: 20 }
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "General",
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.$transaction.mockResolvedValue([[], 100])

      const result = await controller.getGroupMessageList(
        mockGroupId,
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

      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "General",
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.$transaction.mockResolvedValue([deletedMessages, 1])

      const result = await controller.getGroupMessageList(
        mockGroupId,
        mockChannelId,
        mockPagination,
        mockUserId,
      )

      expect(result.data[0].value).toBe("")
    })

    it("should handle database error when checking group access", async () => {
      prismaService.usersOnGroups.findUnique.mockRejectedValue(
        new Error("Database error"),
      )

      await expect(
        controller.getGroupMessageList(
          mockGroupId,
          mockChannelId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow("Database error")
    })

    it("should handle database error when fetching messages", async () => {
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "General",
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.$transaction.mockRejectedValue(
        new Error("Transaction failed"),
      )

      await expect(
        controller.getGroupMessageList(
          mockGroupId,
          mockChannelId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow("Transaction failed")
    })

    it("should handle large pagination values", async () => {
      const extremePagination = { page: 1000, take: 100 }
      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "General",
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getGroupMessageList(
        mockGroupId,
        mockChannelId,
        extremePagination,
        mockUserId,
      )

      expect(result.meta.page).toBe(1000)
      expect(result.meta.take).toBe(100)
    })
  })

  describe("edge cases and error handling", () => {
    it("should handle concurrent operations", async () => {
      const mockUserId = "user-123"
      const mockGroupId = "group-456"
      const mockChannelId = "channel-789"

      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: true,
      }

      const mockChannel = {
        id: mockChannelId,
        groupId: mockGroupId,
        name: "Test Channel",
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.groupMessageChannel.findUnique.mockResolvedValue(
        mockChannel,
      )
      prismaService.groupMessageChannel.update.mockResolvedValue({
        ...mockChannel,
        isDeleted: true,
      })

      const result = await controller.deleteGroupMessageChannel(
        mockGroupId,
        mockChannelId,
        mockUserId,
      )

      expect(result.isDeleted).toBe(true)
    })
    it("should handle malformed UUID parameters", async () => {
      const mockUserId = "user-123"
      const invalidGroupId = "invalid-uuid"
      const mockPagination = { page: 1, take: 10 }

      const mockGroupAccess = {
        userId: mockUserId,
        groupId: invalidGroupId,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getGroupMessageChannelList(
        invalidGroupId,
        mockPagination,
        mockUserId,
      )

      expect(result.data).toEqual([])
    })

    it("should handle transaction timeout", async () => {
      const mockUserId = "user-123"
      const mockGroupId = "group-456"
      const mockPagination = { page: 1, take: 10 }

      const mockGroupAccess = {
        userId: mockUserId,
        groupId: mockGroupId,
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupAccess)
      prismaService.$transaction.mockRejectedValue(
        new Error("Transaction timeout"),
      )

      await expect(
        controller.getGroupMessageChannelList(
          mockGroupId,
          mockPagination,
          mockUserId,
        ),
      ).rejects.toThrow("Transaction timeout")
    })
  })
})
