import { Test, TestingModule } from "@nestjs/testing"
import { BadGatewayException } from "@nestjs/common"
import { FriendController } from "./friend.controller"
import { PrismaService } from "../prisma/prisma.service"
import { UserGuard } from "../auth/guards/user.guard"
import { FriendshipRequestStatus, FriendshipRequest, Friendship, DirectMessageChannel, User, Profile } from "@prisma/client"

// Create a type for the mocked PrismaService
type MockPrismaService = {
  friendshipRequest: {
    findFirst: jest.Mock
    findUnique: jest.Mock
    findMany: jest.Mock
    count: jest.Mock
    create: jest.Mock
    update: jest.Mock
    deleteMany: jest.Mock
  }
  friendship: {
    findMany: jest.Mock
    findUnique: jest.Mock
    count: jest.Mock
    createMany: jest.Mock
    deleteMany: jest.Mock
  }
  directMessageChannel: {
    findFirst: jest.Mock
    create: jest.Mock
  }
  $transaction: jest.Mock
}

describe("FriendController", () => {
  let controller: FriendController
  let prismaService: MockPrismaService

  const mockUserId = "user-123"
  const mockToUserId = "user-456"
  const mockFromUserId = "user-789"

  const mockProfile: Profile = {
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    avatarUrl: "avatar.jpg",
    fullName: "Test User",
    phoneNumber: "1234567890",
    gender: null,
    userId: mockUserId,
  }

  const mockFriendshipRequest: FriendshipRequest = {
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    status: FriendshipRequestStatus.PENDING,
    fromUserId: mockFromUserId,
    toUserId: mockUserId,
  }

  const mockFriendship: Friendship = {
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    fromUserId: mockUserId,
    toUserId: mockToUserId,
  }

  beforeEach(async () => {
    const mockPrismaService: MockPrismaService = {
      friendshipRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      friendship: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      directMessageChannel: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideGuard(UserGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile()

    controller = module.get<FriendController>(FriendController)
    prismaService = module.get<MockPrismaService>(PrismaService)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createFriendshipRequest", () => {
    it("should create a new friendship request successfully", async () => {
      const expectedRequest = {
        ...mockFriendshipRequest,
        fromUserId: mockUserId,
        toUserId: mockToUserId,
      }

      prismaService.friendshipRequest.findFirst.mockResolvedValue(null)
      prismaService.friendshipRequest.create.mockResolvedValue(expectedRequest)

      const result = await controller.createFriendshipRequest(mockToUserId, mockUserId)

      expect(prismaService.friendshipRequest.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              fromUserId: mockUserId,
              toUserId: mockToUserId,
            },
            {
              fromUserId: mockToUserId,
              toUserId: mockUserId,
            },
          ],
        },
      })

      expect(prismaService.friendshipRequest.create).toHaveBeenCalledWith({
        data: {
          fromUserId: mockUserId,
          toUserId: mockToUserId,
        },
      })

      expect(result).toEqual(expectedRequest)
    })

    it("should throw BadGatewayException when friendship request already exists", async () => {
      prismaService.friendshipRequest.findFirst.mockResolvedValue(mockFriendshipRequest)

      await expect(
        controller.createFriendshipRequest(mockToUserId, mockUserId)
      ).rejects.toThrow(new BadGatewayException("Friendship request already exists"))

      expect(prismaService.friendshipRequest.create).not.toHaveBeenCalled()
    })
  })

  describe("getFriendRequestFromMeList", () => {
    it("should return paginated list of outgoing friend requests", async () => {
      const paginationDto = { page: 1, take: 10 }
      const mockData = [
        {
          toUser: {
            profile: mockProfile,
          },
        },
      ]
      const mockTotal = 1

      prismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await controller.getFriendRequestFromMeList(paginationDto, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          // The actual findMany call
        }),
        expect.objectContaining({
          // The actual count call
        }),
      ])

      expect(result).toEqual({
        data: [mockProfile],
        meta: {
          total: mockTotal,
          page: paginationDto.page,
          take: paginationDto.take,
        },
      })
    })
  })

  describe("countFriendRequestFromMe", () => {
    it("should return count of outgoing pending friend requests", async () => {
      const expectedCount = 5
      prismaService.friendshipRequest.count.mockResolvedValue(expectedCount)

      const result = await controller.countFriendRequestFromMe(mockUserId)

      expect(prismaService.friendshipRequest.count).toHaveBeenCalledWith({
        where: {
          fromUserId: mockUserId,
          status: FriendshipRequestStatus.PENDING,
        },
      })

      expect(result).toBe(expectedCount)
    })
  })

  describe("getFriendRequestToMeList", () => {
    it("should return paginated list of incoming friend requests", async () => {
      const paginationDto = { page: 1, take: 10 }
      const mockData = [
        {
          fromUser: {
            profile: mockProfile,
          },
        },
      ]
      const mockTotal = 1

      prismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await controller.getFriendRequestToMeList(paginationDto, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          // The actual findMany call
        }),
        expect.objectContaining({
          // The actual count call
        }),
      ])

      expect(result).toEqual({
        data: [mockProfile],
        meta: {
          total: mockTotal,
          page: paginationDto.page,
          take: paginationDto.take,
        },
      })
    })
  })

  describe("countFriendRequestToMe", () => {
    it("should return count of incoming pending friend requests", async () => {
      const expectedCount = 3
      prismaService.friendshipRequest.count.mockResolvedValue(expectedCount)

      const result = await controller.countFriendRequestToMe(mockUserId)

      expect(prismaService.friendshipRequest.count).toHaveBeenCalledWith({
        where: {
          toUserId: mockUserId,
          status: FriendshipRequestStatus.PENDING,
        },
      })

      expect(result).toBe(expectedCount)
    })
  })

  describe("acceptFriendshipRequest", () => {
    it("should accept friendship request and create friendship when direct message channel doesn't exist", async () => {
      const updatedRequest = {
        ...mockFriendshipRequest,
        status: FriendshipRequestStatus.ACCEPTED,
      }

      prismaService.friendshipRequest.findUnique.mockResolvedValue(mockFriendshipRequest)
      prismaService.directMessageChannel.findFirst.mockResolvedValue(null)
      prismaService.directMessageChannel.create.mockResolvedValue({})
      prismaService.$transaction.mockResolvedValue([updatedRequest])

      const result = await controller.acceptFriendshipRequest(mockFromUserId, mockUserId)

      expect(prismaService.friendshipRequest.findUnique).toHaveBeenCalledWith({
        where: {
          fromUserId_toUserId: {
            fromUserId: mockFromUserId,
            toUserId: mockUserId,
          },
          status: FriendshipRequestStatus.PENDING,
        },
      })

      expect(prismaService.directMessageChannel.create).toHaveBeenCalledWith({
        data: {
          users: {
            createMany: {
              data: [
                { userId: mockFromUserId },
                { userId: mockUserId },
              ],
            },
          },
        },
      })

      expect(prismaService.$transaction).toHaveBeenCalled()
      expect(result).toEqual(updatedRequest)
    })

    it("should accept friendship request when direct message channel already exists", async () => {
      const mockChannel = { id: "channel-123" }
      const updatedRequest = {
        ...mockFriendshipRequest,
        status: FriendshipRequestStatus.ACCEPTED,
      }

      prismaService.friendshipRequest.findUnique.mockResolvedValue(mockFriendshipRequest)
      prismaService.directMessageChannel.findFirst.mockResolvedValue(mockChannel)
      prismaService.$transaction.mockResolvedValue([updatedRequest])

      const result = await controller.acceptFriendshipRequest(mockFromUserId, mockUserId)

      expect(prismaService.directMessageChannel.create).not.toHaveBeenCalled()
      expect(result).toEqual(updatedRequest)
    })

    it("should throw BadGatewayException when friendship request doesn't exist", async () => {
      prismaService.friendshipRequest.findUnique.mockResolvedValue(null)

      await expect(
        controller.acceptFriendshipRequest(mockFromUserId, mockUserId)
      ).rejects.toThrow(new BadGatewayException("Friendship request doesn't exist"))

      expect(prismaService.$transaction).not.toHaveBeenCalled()
    })
  })

  describe("cancelFriendshipRequest", () => {
    it("should cancel friendship request successfully", async () => {
      const deleteResult = { count: 1 }

      prismaService.friendshipRequest.findFirst.mockResolvedValue(mockFriendshipRequest)
      prismaService.friendshipRequest.deleteMany.mockResolvedValue(deleteResult)

      const result = await controller.cancelFriendshipRequest(mockFromUserId, mockUserId)

      expect(prismaService.friendshipRequest.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              fromUserId: mockFromUserId,
              toUserId: mockUserId,
            },
            {
              fromUserId: mockUserId,
              toUserId: mockFromUserId,
            },
          ],
          status: FriendshipRequestStatus.PENDING,
        },
      })

      expect(prismaService.friendshipRequest.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              fromUserId: mockFromUserId,
              toUserId: mockUserId,
            },
            {
              fromUserId: mockUserId,
              toUserId: mockFromUserId,
            },
          ],
          status: FriendshipRequestStatus.PENDING,
        },
      })

      expect(result).toEqual(deleteResult)
    })

    it("should throw BadGatewayException when friendship request doesn't exist", async () => {
      prismaService.friendshipRequest.findFirst.mockResolvedValue(null)

      await expect(
        controller.cancelFriendshipRequest(mockFromUserId, mockUserId)
      ).rejects.toThrow(new BadGatewayException("Friendship request doesn't exist"))

      expect(prismaService.friendshipRequest.deleteMany).not.toHaveBeenCalled()
    })
  })

  describe("getFriendshipList", () => {
    it("should return paginated list of friends with online status", async () => {
      const paginationDto = { page: 1, take: 10 }
      const mockData = [
        {
          toUser: {
            profile: mockProfile,
            wsId: "socket-123",
          },
        },
        {
          toUser: {
            profile: { ...mockProfile, userId: "user-999" },
            wsId: null,
          },
        },
      ]
      const mockTotal = 2

      prismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await controller.getFriendshipList(paginationDto, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          // The actual findMany call
        }),
        expect.objectContaining({
          // The actual count call
        }),
      ])

      expect(result).toEqual({
        data: [
          {
            profile: mockProfile,
            isOnline: true,
          },
          {
            profile: { ...mockProfile, userId: "user-999" },
            isOnline: false,
          },
        ],
        meta: {
          page: paginationDto.page,
          take: paginationDto.take,
          total: mockTotal,
        },
      })
    })
  })

  describe("cancelFriendship", () => {
    it("should cancel friendship successfully", async () => {
      prismaService.friendship.findUnique.mockResolvedValue(mockFriendship)
      prismaService.$transaction.mockResolvedValue([{}, {}])

      const result = await controller.cancelFriendship(mockToUserId, mockUserId)

      expect(prismaService.friendship.findUnique).toHaveBeenCalledWith({
        where: {
          fromUserId_toUserId: {
            fromUserId: mockUserId,
            toUserId: mockToUserId,
          },
        },
      })

      expect(prismaService.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          // The friendship deleteMany call
        }),
        expect.objectContaining({
          // The friendshipRequest deleteMany call
        }),
      ])

      expect(result).toBe("Cancel friendship successfully")
    })

    it("should throw BadGatewayException when friendship doesn't exist", async () => {
      prismaService.friendship.findUnique.mockResolvedValue(null)

      await expect(
        controller.cancelFriendship(mockToUserId, mockUserId)
      ).rejects.toThrow(new BadGatewayException("Friendship doesn't exist"))

      expect(prismaService.$transaction).not.toHaveBeenCalled()
    })
  })

  describe("Error Handling", () => {
    it("should handle database errors in createFriendshipRequest", async () => {
      prismaService.friendshipRequest.findFirst.mockRejectedValue(new Error("Database error"))

      await expect(
        controller.createFriendshipRequest(mockToUserId, mockUserId)
      ).rejects.toThrow("Database error")
    })

    it("should handle database errors in acceptFriendshipRequest", async () => {
      prismaService.friendshipRequest.findUnique.mockRejectedValue(new Error("Database error"))

      await expect(
        controller.acceptFriendshipRequest(mockFromUserId, mockUserId)
      ).rejects.toThrow("Database error")
    })

    it("should handle transaction errors in acceptFriendshipRequest", async () => {
      prismaService.friendshipRequest.findUnique.mockResolvedValue(mockFriendshipRequest)
      prismaService.directMessageChannel.findFirst.mockResolvedValue(null)
      prismaService.directMessageChannel.create.mockResolvedValue({})
      prismaService.$transaction.mockRejectedValue(new Error("Transaction failed"))

      await expect(
        controller.acceptFriendshipRequest(mockFromUserId, mockUserId)
      ).rejects.toThrow("Transaction failed")
    })

    it("should handle database errors in getFriendshipList", async () => {
      const paginationDto = { page: 1, take: 10 }
      prismaService.$transaction.mockRejectedValue(new Error("Database error"))

      await expect(
        controller.getFriendshipList(paginationDto, mockUserId)
      ).rejects.toThrow("Database error")
    })

    it("should handle database errors in cancelFriendship", async () => {
      prismaService.friendship.findUnique.mockRejectedValue(new Error("Database error"))

      await expect(
        controller.cancelFriendship(mockToUserId, mockUserId)
      ).rejects.toThrow("Database error")
    })
  })

  describe("Edge Cases", () => {
    it("should handle pagination with page 0", async () => {
      const paginationDto = { page: 0, take: 10 }
      const mockData = []
      const mockTotal = 0

      prismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await controller.getFriendRequestFromMeList(paginationDto, mockUserId)

      expect(result.meta.page).toBe(0)
    })

    it("should handle large take values in pagination", async () => {
      const paginationDto = { page: 1, take: 1000 }
      const mockData = []
      const mockTotal = 0

      prismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await controller.getFriendshipList(paginationDto, mockUserId)

      expect(result.meta.take).toBe(1000)
    })

    it("should handle empty friend list", async () => {
      const paginationDto = { page: 1, take: 10 }
      const mockData = []
      const mockTotal = 0

      prismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await controller.getFriendshipList(paginationDto, mockUserId)

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })
  })
})
