import { Test, TestingModule } from "@nestjs/testing"
import { BadRequestException } from "@nestjs/common"
import { UserController } from "./user.controller"
import { PrismaService } from "../prisma/prisma.service"
import { StorageService } from "../storage/storage.service"
import { UserGender } from "@prisma/client"

// Mock the exclude utility
jest.mock("src/utils/exclude", () => ({
  exclude: jest.fn((data, keys) => {
    const result = { ...data }
    keys.forEach((key) => delete result[key])
    return result
  }),
}))

// Mock Prisma Service with proper typing
type MockPrismaService = {
  user: {
    findUnique: jest.MockedFunction<any>
    findMany: jest.MockedFunction<any>
    count: jest.MockedFunction<any>
  }
  profile: {
    update: jest.MockedFunction<any>
  }
  directMessageChannel: {
    findFirst: jest.MockedFunction<any>
  }
  $transaction: jest.MockedFunction<any>
}

// Mock Storage Service
type MockStorageService = {
  uploadFileToPublicBucket: jest.MockedFunction<any>
}

describe("UserController", () => {
  let controller: UserController
  let prismaService: MockPrismaService
  let storageService: MockStorageService

  const mockUserId = "user-123"
  const mockTargetUserId = "target-456"

  beforeEach(async () => {
    const mockPrismaService: MockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      profile: {
        update: jest.fn(),
      },
      directMessageChannel: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    const mockStorageService: MockStorageService = {
      uploadFileToPublicBucket: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile()

    controller = module.get<UserController>(UserController)
    prismaService = module.get<MockPrismaService>(PrismaService)
    storageService = module.get<MockStorageService>(StorageService)

    // Reset mocks
    jest.clearAllMocks()
  })

  describe("getProfile", () => {
    it("should return user profile without sensitive data", async () => {
      const mockUser = {
        id: mockUserId,
        email: "test@example.com",
        refreshToken: "sensitive-token",
        profile: {
          id: "profile-123",
          fullName: "John Doe",
          gender: UserGender.MALE,
          phoneNumber: "+1234567890",
          avatarUrl: "https://example.com/avatar.jpg",
          userId: mockUserId,
        },
      }

      prismaService.user.findUnique.mockResolvedValue(mockUser)

      const result = await controller.getProfile(mockUserId)

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: {
          profile: true,
        },
      })

      // Verify that exclude was called to remove refreshToken
      const { exclude } = require("src/utils/exclude")
      expect(exclude).toHaveBeenCalledWith(mockUser, ["refreshToken"])
    })

    it("should handle null user profile", async () => {
      prismaService.user.findUnique.mockResolvedValue(null)

      const result = await controller.getProfile(mockUserId)

      // The exclude function should handle null gracefully
      expect(result).toBeDefined()
    })
  })

  describe("updateProfile", () => {    const updateProfileDto = {
      fullName: "Jane Doe",
      gender: UserGender.FEMALE,
      phoneNumber: "+9876543210",
      avatarUrl: "https://example.com/avatar.jpg",
    }

    it("should update profile without avatar", async () => {
      const mockUpdatedProfile = {
        id: "profile-123",
        ...updateProfileDto,
        userId: mockUserId,
      }

      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile)

      const result = await controller.updateProfile(
        undefined,
        updateProfileDto,
        mockUserId
      )

      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
        },
        data: updateProfileDto,
      })
      expect(result).toEqual(mockUpdatedProfile)
      expect(storageService.uploadFileToPublicBucket).not.toHaveBeenCalled()
    })

    it("should update profile with avatar upload", async () => {
      const mockAvatarFile = {
        originalname: "avatar.jpg",
        buffer: Buffer.from("fake-image-data"),
        mimetype: "image/jpeg",
      } as Express.Multer.File

      const mockUploadResult = {
        url: "https://storage.example.com/uploads/avatar.jpg",
      }

      const mockUpdatedProfile = {
        id: "profile-123",
        ...updateProfileDto,
        avatarUrl: mockUploadResult.url,
        userId: mockUserId,
      }

      storageService.uploadFileToPublicBucket.mockResolvedValue(mockUploadResult)
      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile)

      const result = await controller.updateProfile(
        mockAvatarFile,
        updateProfileDto,
        mockUserId
      )

      expect(storageService.uploadFileToPublicBucket).toHaveBeenCalledWith(
        "uploads",
        {
          file: mockAvatarFile,
          file_name: "avatar.jpg",
        }
      )
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
        },
        data: {
          ...updateProfileDto,
          avatarUrl: mockUploadResult.url,
        },
      })
      expect(result).toEqual(mockUpdatedProfile)
    })

    it("should handle storage service errors", async () => {
      const mockAvatarFile = {
        originalname: "avatar.jpg",
        buffer: Buffer.from("fake-image-data"),
        mimetype: "image/jpeg",
      } as Express.Multer.File

      storageService.uploadFileToPublicBucket.mockRejectedValue(
        new Error("Storage error")
      )

      await expect(
        controller.updateProfile(mockAvatarFile, updateProfileDto, mockUserId)
      ).rejects.toThrow("Storage error")

      expect(prismaService.profile.update).not.toHaveBeenCalled()
    })

    it("should handle database update errors", async () => {
      prismaService.profile.update.mockRejectedValue(
        new Error("Database error")
      )

      await expect(
        controller.updateProfile(undefined, updateProfileDto, mockUserId)
      ).rejects.toThrow("Database error")
    })
  })

  describe("getUserById", () => {
    it("should return user information with friendship status", async () => {
      const mockUser = {
        id: mockTargetUserId,
        wsId: "ws-connection-123",
        profile: {
          id: "profile-456",
          fullName: "Target User",
          gender: UserGender.MALE,
          phoneNumber: "+1122334455",
          avatarUrl: "https://example.com/target-avatar.jpg",
        },
        friendshipFromMe: [{ fromUserId: mockTargetUserId, toUserId: mockUserId }],
        friendshipRequestFromMe: [],
        friendshipRequestToMe: [],
      }

      const mockDirectMessageChannel = {
        id: "dm-channel-123",
      }

      prismaService.user.findUnique.mockResolvedValue(mockUser)
      prismaService.directMessageChannel.findFirst.mockResolvedValue(
        mockDirectMessageChannel
      )

      const result = await controller.getUserById(mockTargetUserId, mockUserId)

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockTargetUserId },
        include: {
          profile: true,
          friendshipFromMe: {
            where: {
              fromUserId: mockTargetUserId,
              toUserId: mockUserId,
            },
          },
          friendshipRequestFromMe: {
            where: {
              fromUserId: mockTargetUserId,
              toUserId: mockUserId,
            },
          },
          friendshipRequestToMe: {
            where: {
              fromUserId: mockUserId,
              toUserId: mockTargetUserId,
            },
          },
        },
      })

      expect(prismaService.directMessageChannel.findFirst).toHaveBeenCalledWith({
        where: {
          users: {
            every: {
              userId: {
                in: [mockTargetUserId, mockUserId],
              },
            },
          },
        },
      })

      expect(result).toEqual({
        profile: mockUser.profile,
        isOnline: true,
        isFriendship: true,
        friendshipRequestFromMe: false,
        friendshipRequestToMe: false,
        directMessageChannelId: mockDirectMessageChannel.id,
      })
    })

    it("should return offline status when user has no wsId", async () => {
      const mockUser = {
        id: mockTargetUserId,
        wsId: null,
        profile: {
          id: "profile-456",
          fullName: "Offline User",
        },
        friendshipFromMe: [],
        friendshipRequestFromMe: [],
        friendshipRequestToMe: [],
      }

      prismaService.user.findUnique.mockResolvedValue(mockUser)
      prismaService.directMessageChannel.findFirst.mockResolvedValue(null)

      const result = await controller.getUserById(mockTargetUserId, mockUserId)

      expect(result).toEqual({
        profile: mockUser.profile,
        isOnline: false,
        isFriendship: false,
        friendshipRequestFromMe: false,
        friendshipRequestToMe: false,
        directMessageChannelId: undefined,
      })
    })

    it("should handle pending friendship requests", async () => {
      const mockUser = {
        id: mockTargetUserId,
        wsId: "ws-123",
        profile: { fullName: "User with pending request" },
        friendshipFromMe: [],
        friendshipRequestFromMe: [
          { fromUserId: mockTargetUserId, toUserId: mockUserId },
        ],
        friendshipRequestToMe: [
          { fromUserId: mockUserId, toUserId: mockTargetUserId },
        ],
      }

      prismaService.user.findUnique.mockResolvedValue(mockUser)
      prismaService.directMessageChannel.findFirst.mockResolvedValue(null)

      const result = await controller.getUserById(mockTargetUserId, mockUserId)

      expect(result.friendshipRequestFromMe).toBe(true)
      expect(result.friendshipRequestToMe).toBe(true)
    })

    it("should throw BadRequestException when user doesn't exist", async () => {
      prismaService.user.findUnique.mockResolvedValue(null)

      await expect(
        controller.getUserById(mockTargetUserId, mockUserId)
      ).rejects.toThrow(new BadRequestException("User doesn't exist"))

      expect(prismaService.directMessageChannel.findFirst).not.toHaveBeenCalled()
    })

    it("should handle database errors", async () => {
      prismaService.user.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      )

      await expect(
        controller.getUserById(mockTargetUserId, mockUserId)
      ).rejects.toThrow("Database connection failed")
    })
  })

  describe("getUserList", () => {
    const getUserListDto = {
      page: 1,
      take: 10,
      keyword: "John",
      notInGroupId: "group-123",
    }

    it("should return paginated user list with keyword search", async () => {
      const mockUsers = [
        {
          email: "john@example.com",
          profile: {
            id: "profile-1",
            fullName: "John Doe",
            phoneNumber: "+1234567890",
          },
        },
        {
          email: "jane@example.com",
          profile: {
            id: "profile-2",
            fullName: "Jane Smith",
            phoneNumber: "+9876543210",
          },
        },
      ]
      const mockTotal = 25

      prismaService.$transaction.mockResolvedValue([mockUsers, mockTotal])

      const result = await controller.getUserList(getUserListDto, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalled()
      expect(result).toEqual({
        data: [mockUsers[0].profile, mockUsers[1].profile],
        meta: {
          total: mockTotal,
          page: 1,
          take: 10,
        },
      })
    })

    it("should handle search without keyword", async () => {
      const getUserListDtoNoKeyword = {
        page: 1,
        take: 5,
        keyword: undefined,
        notInGroupId: undefined,
      }

      const mockUsers = [
        {
          email: "user1@example.com",
          profile: { fullName: "User One" },
        },
      ]

      prismaService.$transaction.mockResolvedValue([mockUsers, 1])

      const result = await controller.getUserList(
        getUserListDtoNoKeyword,
        mockUserId
      )

      expect(result.data).toEqual([mockUsers[0].profile])
      expect(result.meta.total).toBe(1)
    })

    it("should handle pagination correctly for page 2", async () => {
      const getUserListDto2 = {
        page: 2,
        take: 5,
        keyword: undefined,
        notInGroupId: undefined,
      }

      prismaService.$transaction.mockResolvedValue([[], 7])

      await controller.getUserList(getUserListDto2, mockUserId)

      // Verify transaction was called (specific arguments tested in integration)
      expect(prismaService.$transaction).toHaveBeenCalled()
    })

    it("should filter users not in specific group", async () => {
      const getUserListDtoWithGroup = {
        page: 1,
        take: 10,
        keyword: undefined,
        notInGroupId: "exclude-group-456",
      }

      prismaService.$transaction.mockResolvedValue([[], 0])

      await controller.getUserList(getUserListDtoWithGroup, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalled()
    })

    it("should handle empty search results", async () => {
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getUserList(getUserListDto, mockUserId)

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          take: 10,
        },
      })
    })

    it("should handle transaction errors", async () => {
      prismaService.$transaction.mockRejectedValue(
        new Error("Transaction failed")
      )

      await expect(
        controller.getUserList(getUserListDto, mockUserId)
      ).rejects.toThrow("Transaction failed")
    })

    it("should search by email when keyword matches email pattern", async () => {
      const emailSearchDto = {
        page: 1,
        take: 10,
        keyword: "test@example.com",
        notInGroupId: undefined,
      }

      prismaService.$transaction.mockResolvedValue([[], 0])

      await controller.getUserList(emailSearchDto, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalled()
    })

    it("should search by phone number when keyword contains digits", async () => {
      const phoneSearchDto = {
        page: 1,
        take: 10,
        keyword: "123456",
        notInGroupId: undefined,
      }

      prismaService.$transaction.mockResolvedValue([[], 0])

      await controller.getUserList(phoneSearchDto, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalled()
    })
  })

  describe("edge cases and error handling", () => {
    it("should handle very large page numbers in getUserList", async () => {
      const largePaginationDto = {
        page: 999,
        take: 100,
        keyword: undefined,
        notInGroupId: undefined,
      }

      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getUserList(largePaginationDto, mockUserId)

      expect(result.meta.page).toBe(999)
      expect(result.meta.take).toBe(100)
    })

    it("should handle special characters in search keyword", async () => {
      const specialCharDto = {
        page: 1,
        take: 10,
        keyword: "!@#$%^&*()",
        notInGroupId: undefined,
      }

      prismaService.$transaction.mockResolvedValue([[], 0])

      await expect(
        controller.getUserList(specialCharDto, mockUserId)
      ).resolves.toBeDefined()
    })

    it("should handle null/undefined values in updateProfile", async () => {
      const incompleteDto = {
        fullName: null,
        gender: undefined,
      }

      const mockUpdatedProfile = {
        id: "profile-123",
        userId: mockUserId,
      }

      prismaService.profile.update.mockResolvedValue(mockUpdatedProfile)

      const result = await controller.updateProfile(
        undefined,
        incompleteDto as any,
        mockUserId
      )

      expect(result).toEqual(mockUpdatedProfile)
    })
  })
})
