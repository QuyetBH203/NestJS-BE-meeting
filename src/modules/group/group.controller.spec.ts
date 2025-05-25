import { Test, TestingModule } from "@nestjs/testing"
import { BadRequestException } from "@nestjs/common"
import { GroupController } from "./group.controller"
import { PrismaService } from "../prisma/prisma.service"
import { generateCode } from "src/utils/generateCode"

// Mock the generateCode utility
jest.mock("src/utils/generateCode")
const mockGenerateCode = generateCode as jest.MockedFunction<typeof generateCode>

// Mock Prisma Service with proper typing
type MockPrismaService = {
  group: {
    count: jest.MockedFunction<any>
    create: jest.MockedFunction<any>
    findUnique: jest.MockedFunction<any>
    findFirst: jest.MockedFunction<any>
    update: jest.MockedFunction<any>
  }
  usersOnGroups: {
    findMany: jest.MockedFunction<any>
    count: jest.MockedFunction<any>
    findUnique: jest.MockedFunction<any>
    create: jest.MockedFunction<any>
    delete: jest.MockedFunction<any>
    update: jest.MockedFunction<any>
  }
  $transaction: jest.MockedFunction<any>
}

describe("GroupController", () => {
  let controller: GroupController
  let prismaService: MockPrismaService

  const mockUserId = "user-123"
  const mockGroupId = "group-123"
  const mockTargetUserId = "target-456"
  const mockInviteCode = "INVITE123"
  beforeEach(async () => {
    const mockPrismaService: MockPrismaService = {
      group: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      usersOnGroups: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    controller = module.get<GroupController>(GroupController)
    prismaService = module.get<MockPrismaService>(PrismaService)

    // Reset mocks
    jest.clearAllMocks()
    mockGenerateCode.mockReturnValue("GENERATED123")
  })

  describe("createGroup", () => {    const createGroupDto = {
      name: "Test Group",
      imageUrl: "https://example.com/image.jpg",
    }

    it("should create a group successfully when user owns less than 10 groups", async () => {      const mockCreatedGroup = {
        id: mockGroupId,
        name: "Test Group",
        imageUrl: "https://example.com/image.jpg",
        ownerId: mockUserId,
        inviteCode: "GENERATED123",
      }

      prismaService.group.count.mockResolvedValue(5)
      prismaService.group.create.mockResolvedValue(mockCreatedGroup)

      const result = await controller.createGroup(createGroupDto, mockUserId)

      expect(prismaService.group.count).toHaveBeenCalledWith({
        where: { ownerId: mockUserId },
      })
      expect(prismaService.group.create).toHaveBeenCalledWith({
        data: {
          ...createGroupDto,
          ownerId: mockUserId,
          inviteCode: "GENERATED123",
          users: {
            create: {
              userId: mockUserId,
              isOwner: true,
            },
          },
        },
      })
      expect(result).toEqual(mockCreatedGroup)
    })

    it("should throw BadRequestException when user already owns 10 groups", async () => {
      prismaService.group.count.mockResolvedValue(10)

      await expect(
        controller.createGroup(createGroupDto, mockUserId)
      ).rejects.toThrow(
        new BadRequestException("You can only own a maximum of 10 groups")
      )

      expect(prismaService.group.create).not.toHaveBeenCalled()
    })

    it("should throw BadRequestException when user owns more than 10 groups", async () => {
      prismaService.group.count.mockResolvedValue(15)

      await expect(
        controller.createGroup(createGroupDto, mockUserId)
      ).rejects.toThrow(
        new BadRequestException("You can only own a maximum of 10 groups")
      )
    })
  })
  describe("getJoinedGroupList", () => {
    const paginationDto = { page: 1, take: 10 }

    it("should return paginated list of joined groups", async () => {
      const mockGroupData = [
        { group: { id: "group-1", name: "Group 1" } },
        { group: { id: "group-2", name: "Group 2" } },
      ]
      const mockTotal = 15

      prismaService.$transaction.mockResolvedValue([mockGroupData, mockTotal])

      const result = await controller.getJoinedGroupList(
        paginationDto,
        mockUserId
      )

      expect(prismaService.$transaction).toHaveBeenCalled()

      expect(result).toEqual({
        data: mockGroupData,
        meta: {
          page: 1,
          take: 10,
          total: 15,
        },
      })
    })

    it("should handle pagination correctly for page 2", async () => {
      const paginationDto2 = { page: 2, take: 5 }
      const mockGroupData = [{ group: { id: "group-3", name: "Group 3" } }]

      prismaService.$transaction.mockResolvedValue([mockGroupData, 7])

      await controller.getJoinedGroupList(paginationDto2, mockUserId)

      expect(prismaService.$transaction).toHaveBeenCalled()
    })

    it("should return empty data when user has no groups", async () => {
      prismaService.$transaction.mockResolvedValue([[], 0])

      const result = await controller.getJoinedGroupList(
        paginationDto,
        mockUserId
      )

      expect(result).toEqual({
        data: [],
        meta: {
          page: 1,
          take: 10,
          total: 0,
        },
      })
    })
  })

  describe("getGroup", () => {
    it("should return group information when user is a member", async () => {
      const mockGroupData = {
        group: {
          id: mockGroupId,
          name: "Test Group",
          _count: {
            users: 5,
            channels: 3,
          },
        },
      }

      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockGroupData)

      const result = await controller.getGroup(mockGroupId, mockUserId)

      expect(prismaService.usersOnGroups.findUnique).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            groupId: mockGroupId,
            userId: mockUserId,
          },
        },
        select: {
          group: {
            include: {
              _count: {
                select: {
                  users: true,
                  channels: true,
                },
              },
            },
          },
        },
      })
      expect(result).toEqual(mockGroupData.group)
    })

    it("should throw BadRequestException when user is not a member", async () => {
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.getGroup(mockGroupId, mockUserId)
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })

    it("should throw BadRequestException when group doesn't exist", async () => {
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.getGroup("non-existent-group", mockUserId)
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })
  })

  describe("getGroupMemberList", () => {
    const paginationDto = { page: 1, take: 10 }

    it("should return paginated group members with online status", async () => {
      const mockMemberData = [
        {
          isOwner: true,
          user: {
            wsId: "ws-123",
            profile: { name: "Owner User" },
          },
        },
        {
          isOwner: false,
          user: {
            wsId: null,
            profile: { name: "Member User" },
          },
        },
      ]
      const mockTotal = 2

      prismaService.usersOnGroups.findUnique.mockResolvedValue({
        groupId: mockGroupId,
      })
      prismaService.$transaction.mockResolvedValue([mockMemberData, mockTotal])

      const result = await controller.getGroupMemberList(
        mockGroupId,
        paginationDto,
        mockUserId
      )

      expect(result).toEqual({
        data: [
          {
            isOwner: true,
            user: {
              profile: { name: "Owner User" },
              isOnline: true,
            },
          },
          {
            isOwner: false,
            user: {
              profile: { name: "Member User" },
              isOnline: false,
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

    it("should throw BadRequestException when user doesn't have permission", async () => {
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.getGroupMemberList(mockGroupId, paginationDto, mockUserId)
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })

    it("should handle pagination correctly", async () => {
      const paginationDto2 = { page: 2, take: 5 }

      prismaService.usersOnGroups.findUnique.mockResolvedValue({
        groupId: mockGroupId,
      })
      prismaService.$transaction.mockResolvedValue([[], 0])

      await controller.getGroupMemberList(
        mockGroupId,
        paginationDto2,
        mockUserId
      )

      expect(prismaService.$transaction).toHaveBeenCalled()
    })
  })

  describe("updateGroup", () => {
    const updateGroupDto = {
      name: "Updated Group Name",
      description: "Updated Description",
    }

    it("should update group when user is owner", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      const mockUpdatedGroup = { ...mockGroup, ...updateGroupDto }

      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.group.update.mockResolvedValue(mockUpdatedGroup)

      const result = await controller.updateGroup(
        mockGroupId,
        updateGroupDto,
        mockUserId
      )

      expect(prismaService.group.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockGroupId,
          ownerId: mockUserId,
        },
      })
      expect(prismaService.group.update).toHaveBeenCalledWith({
        data: updateGroupDto,
        where: {
          id: mockGroupId,
        },
      })
      expect(result).toEqual(mockUpdatedGroup)
    })

    it("should throw BadRequestException when user is not owner", async () => {
      prismaService.group.findUnique.mockResolvedValue(null)

      await expect(
        controller.updateGroup(mockGroupId, updateGroupDto, mockUserId)
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )

      expect(prismaService.group.update).not.toHaveBeenCalled()
    })

    it("should throw BadRequestException when group doesn't exist", async () => {
      prismaService.group.findUnique.mockResolvedValue(null)

      await expect(
        controller.updateGroup("non-existent-group", updateGroupDto, mockUserId)
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })
  })

  describe("deleteGroupMember", () => {
    it("should delete group member when user is owner", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      const mockUserOnGroup = { userId: mockTargetUserId, groupId: mockGroupId }

      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockUserOnGroup)
      prismaService.usersOnGroups.delete.mockResolvedValue(mockUserOnGroup)

      const result = await controller.deleteGroupMember(
        mockGroupId,
        mockTargetUserId,
        mockUserId
      )

      expect(prismaService.usersOnGroups.delete).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            userId: mockTargetUserId,
            groupId: mockGroupId,
          },
        },
      })
      expect(result).toEqual(mockUserOnGroup)
    })

    it("should throw BadRequestException when user is not owner", async () => {
      prismaService.group.findUnique.mockResolvedValue(null)

      await expect(
        controller.deleteGroupMember(mockGroupId, mockTargetUserId, mockUserId)
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })

    it("should throw BadRequestException when trying to delete self", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      prismaService.group.findUnique.mockResolvedValue(mockGroup)

      await expect(
        controller.deleteGroupMember(mockGroupId, mockUserId, mockUserId)
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })

    it("should throw BadRequestException when target user is not a member", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.deleteGroupMember(mockGroupId, mockTargetUserId, mockUserId)
      ).rejects.toThrow(
        new BadRequestException("User isn't group member")
      )
    })
  })

  describe("leaveGroup", () => {
    it("should allow regular member to leave group", async () => {
      const mockUserOnGroup = { userId: mockUserId, groupId: mockGroupId, isOwner: false }
      const mockCountMembers = 5

      prismaService.$transaction.mockResolvedValue([mockUserOnGroup, mockCountMembers])
      prismaService.usersOnGroups.delete.mockResolvedValue(mockUserOnGroup)

      const result = await controller.leaveGroup(mockGroupId, mockUserId)

      expect(prismaService.usersOnGroups.delete).toHaveBeenCalledWith({
        where: {
          userId_groupId: {
            userId: mockUserId,
            groupId: mockGroupId,
          },
        },
      })
      expect(result).toEqual(mockUserOnGroup)
    })

    it("should allow owner to leave when they are the only member", async () => {
      const mockUserOnGroup = { userId: mockUserId, groupId: mockGroupId, isOwner: true }
      const mockCountMembers = 1

      prismaService.$transaction.mockResolvedValue([mockUserOnGroup, mockCountMembers])
      prismaService.usersOnGroups.delete.mockResolvedValue(mockUserOnGroup)

      const result = await controller.leaveGroup(mockGroupId, mockUserId)

      expect(result).toEqual(mockUserOnGroup)
    })

    it("should throw BadRequestException when user is not a member", async () => {
      prismaService.$transaction.mockResolvedValue([null, 5])

      await expect(
        controller.leaveGroup(mockGroupId, mockUserId)
      ).rejects.toThrow(
        new BadRequestException("You're not group member")
      )
    })

    it("should throw BadRequestException when owner tries to leave with other members", async () => {
      const mockUserOnGroup = { userId: mockUserId, groupId: mockGroupId, isOwner: true }
      const mockCountMembers = 3

      prismaService.$transaction.mockResolvedValue([mockUserOnGroup, mockCountMembers])

      await expect(
        controller.leaveGroup(mockGroupId, mockUserId)
      ).rejects.toThrow(
        new BadRequestException("You're group owner")
      )
    })
  })

  describe("createGroupInviteCode", () => {
    const createInviteCodeDto = { inviteCodeMaxNumberOfUses: 10 }

    it("should create invite code when user is owner", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      const mockUpdatedGroup = {
        ...mockGroup,
        inviteCode: "GENERATED123",
        inviteCodeNumberOfUses: 0,
        inviteCodeMaxNumberOfUses: 10,
      }

      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.group.update.mockResolvedValue(mockUpdatedGroup)

      const result = await controller.createGroupInviteCode(
        mockGroupId,
        createInviteCodeDto,
        mockUserId
      )

      expect(prismaService.group.update).toHaveBeenCalledWith({
        where: { id: mockGroupId },
        data: {
          inviteCode: "GENERATED123",
          inviteCodeNumberOfUses: 0,
          inviteCodeMaxNumberOfUses: 10,
        },
      })
      expect(result).toEqual(mockUpdatedGroup)
    })

    it("should throw BadRequestException when user is not owner", async () => {
      prismaService.group.findUnique.mockResolvedValue(null)

      await expect(
        controller.createGroupInviteCode(
          mockGroupId,
          createInviteCodeDto,
          mockUserId
        )
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })
  })

  describe("joinGroup", () => {
    it("should join group with unlimited uses invite code", async () => {
      const mockGroup = {
        id: mockGroupId,
        inviteCode: mockInviteCode,
        inviteCodeMaxNumberOfUses: null,
        inviteCodeNumberOfUses: 5,
      }
      const mockCreatedMembership = {
        userId: mockUserId,
        groupId: mockGroupId,
        isOwner: false,
      }

      prismaService.group.findFirst.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)
      prismaService.usersOnGroups.create.mockResolvedValue(mockCreatedMembership)

      const result = await controller.joinGroup(mockInviteCode, mockUserId)

      expect(prismaService.usersOnGroups.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          groupId: mockGroupId,
          isOwner: false,
        },
      })
      expect(result).toEqual(mockCreatedMembership)
    })

    it("should join group and increment usage count when under limit", async () => {
      const mockGroup = {
        id: mockGroupId,
        inviteCode: mockInviteCode,
        inviteCodeMaxNumberOfUses: 10,
        inviteCodeNumberOfUses: 5,
      }

      prismaService.group.findFirst.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)
      prismaService.group.update.mockResolvedValue({})
      prismaService.usersOnGroups.create.mockResolvedValue({})

      await controller.joinGroup(mockInviteCode, mockUserId)

      expect(prismaService.group.update).toHaveBeenCalledWith({
        where: { id: mockGroupId },
        data: {
          inviteCodeNumberOfUses: {
            increment: 1,
          },
        },
      })
    })

    it("should regenerate invite code when reaching max uses", async () => {
      const mockGroup = {
        id: mockGroupId,
        inviteCode: mockInviteCode,
        inviteCodeMaxNumberOfUses: 10,
        inviteCodeNumberOfUses: 9,
      }

      prismaService.group.findFirst.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)
      prismaService.group.update.mockResolvedValue({})
      prismaService.usersOnGroups.create.mockResolvedValue({})

      await controller.joinGroup(mockInviteCode, mockUserId)

      expect(prismaService.group.update).toHaveBeenCalledWith({
        where: { id: mockGroupId },
        data: {
          inviteCode: "GENERATED123",
          inviteCodeNumberOfUses: 0,
        },
      })
    })

    it("should throw BadRequestException when invite code doesn't exist", async () => {
      prismaService.group.findFirst.mockResolvedValue(null)

      await expect(
        controller.joinGroup("INVALID_CODE", mockUserId)
      ).rejects.toThrow(
        new BadRequestException("Group invite code does not exist")
      )
    })

    it("should throw BadRequestException when user is already a member", async () => {
      const mockGroup = { id: mockGroupId, inviteCode: mockInviteCode }
      const mockUserOnGroup = { userId: mockUserId, groupId: mockGroupId }

      prismaService.group.findFirst.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockUserOnGroup)

      await expect(
        controller.joinGroup(mockInviteCode, mockUserId)
      ).rejects.toThrow(
        new BadRequestException("You're group member")
      )
    })
  })

  describe("checkGroupInviteCode", () => {
    it("should return group info when invite code is valid and user is not a member", async () => {
      const mockGroup = {
        id: mockGroupId,
        name: "Test Group",
        inviteCode: mockInviteCode,
        owner: {
          profile: { name: "Owner Name" },
        },
      }

      prismaService.group.findFirst.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      const result = await controller.checkGroupInviteCode(
        mockInviteCode,
        mockUserId
      )

      expect(prismaService.group.findFirst).toHaveBeenCalledWith({
        where: { inviteCode: mockInviteCode },
        include: {
          owner: {
            select: {
              profile: true,
            },
          },
        },
      })
      expect(result).toEqual(mockGroup)
    })

    it("should throw BadRequestException when invite code doesn't exist", async () => {
      prismaService.group.findFirst.mockResolvedValue(null)

      await expect(
        controller.checkGroupInviteCode("INVALID_CODE", mockUserId)
      ).rejects.toThrow(
        new BadRequestException("Group invite code does not exist")
      )
    })

    it("should throw BadRequestException when user is already a member", async () => {
      const mockGroup = { id: mockGroupId, inviteCode: mockInviteCode }
      const mockUserOnGroup = { userId: mockUserId, groupId: mockGroupId }

      prismaService.group.findFirst.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockUserOnGroup)

      await expect(
        controller.checkGroupInviteCode(mockInviteCode, mockUserId)
      ).rejects.toThrow(
        new BadRequestException("You're group member")
      )
    })
  })

  describe("groupTransferOwnership", () => {
    it("should transfer ownership successfully", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      const mockUserOnGroup = { userId: mockTargetUserId, groupId: mockGroupId }
      const mockUpdatedGroup = { ...mockGroup, ownerId: mockTargetUserId }

      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockUserOnGroup)
      prismaService.group.count.mockResolvedValue(5)
      prismaService.$transaction.mockResolvedValue([mockUpdatedGroup, {}, {}])

      const result = await controller.groupTransferOwnership(        mockGroupId,
        mockTargetUserId,
        mockUserId
      )
      expect(prismaService.$transaction).toHaveBeenCalled()
      expect(result).toEqual(mockUpdatedGroup)
    })

    it("should throw BadRequestException when user is not owner", async () => {
      prismaService.group.findUnique.mockResolvedValue(null)

      await expect(
        controller.groupTransferOwnership(
          mockGroupId,
          mockTargetUserId,
          mockUserId
        )
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })

    it("should throw BadRequestException when trying to transfer to self", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      prismaService.group.findUnique.mockResolvedValue(mockGroup)

      await expect(
        controller.groupTransferOwnership(mockGroupId, mockUserId, mockUserId)
      ).rejects.toThrow(
        new BadRequestException(
          "Group doesn't exist or you don't have permission"
        )
      )
    })

    it("should throw BadRequestException when target user is not a member", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(null)

      await expect(
        controller.groupTransferOwnership(
          mockGroupId,
          mockTargetUserId,
          mockUserId
        )
      ).rejects.toThrow(
        new BadRequestException("User isn't group member")
      )
    })

    it("should throw BadRequestException when target user already owns 10 groups", async () => {
      const mockGroup = { id: mockGroupId, ownerId: mockUserId }
      const mockUserOnGroup = { userId: mockTargetUserId, groupId: mockGroupId }

      prismaService.group.findUnique.mockResolvedValue(mockGroup)
      prismaService.usersOnGroups.findUnique.mockResolvedValue(mockUserOnGroup)
      prismaService.group.count.mockResolvedValue(10)

      await expect(
        controller.groupTransferOwnership(
          mockGroupId,
          mockTargetUserId,
          mockUserId
        )
      ).rejects.toThrow(
        new BadRequestException("User can only own a maximum of 10 groups")
      )
    })
  })
})
