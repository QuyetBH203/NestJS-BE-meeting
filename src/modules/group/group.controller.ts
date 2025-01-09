import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { Prisma } from "@prisma/client"
import { CurrentUser } from "src/decorators/current-user.decorator"
import { PaginationDto } from "src/dto/pagination.dto"
import { generateCode } from "src/utils/generateCode"
import { UserGuard } from "../auth/guards/user.guard"
import { PrismaService } from "../prisma/prisma.service"
import { CreateGroupInviteCodeDto } from "./dto/create-group-invite-code.dto"
import { CreateGroupDto } from "./dto/create-group.dto"
import { UpdateGroupDto } from "./dto/update-group.dto"

@ApiTags("Group")
@ApiBearerAuth()
@UseGuards(UserGuard)
@Controller("group")
export class GroupController {
  constructor(private prismaService: PrismaService) {}

  @ApiOperation({
    summary: "Tạo group",
  })
  @Post()
  async createGroup(
    @Body() data: CreateGroupDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const countOwnGroup = await this.prismaService.group.count({
      where: {
        ownerId: userId,
      },
    })
    if (countOwnGroup >= 10)
      throw new BadRequestException("You can only own a maximum of 10 groups")
    return this.prismaService.group.create({
      data: {
        ...data,
        ownerId: userId,
        inviteCode: generateCode(),
        users: {
          create: {
            userId,
            isOwner: true,
          },
        },
      },
    })
  }

  @ApiOperation({
    summary: "Lấy danh sách group đang tham gia",
  })
  @Get("joined")
  async getJoinedGroupList(
    @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.usersOnGroups.findMany({
        where: {
          userId,
        },
        select: {
          group: true,
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.usersOnGroups.count({
        where: {
          userId,
        },
      }),
    ])
    return {
      data,
      meta: {
        page,
        take,
        total,
      },
    }
  }

  @ApiOperation({
    summary: "Lấy thông tin nhóm",
  })
  @Get(":groupId")
  async getGroup(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const userOnGroup = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          groupId,
          userId,
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
    if (!userOnGroup)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    return userOnGroup.group
  }

  @ApiOperation({
    summary: "Lấy danh sách thành viên trong group",
  })
  @Get(":groupId/members")
  async getGroupMemberList(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Query() { page, take }: PaginationDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: { groupId, userId },
      },
    })
    if (!group)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )

    const where: Prisma.UsersOnGroupsWhereInput = {
      group: {
        id: groupId,
      },
    }
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.usersOnGroups.findMany({
        where,
        select: {
          isOwner: true,
          user: {
            select: {
              wsId: true,
              profile: true,
            },
          },
        },
        orderBy: {
          isOwner: "desc",
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prismaService.usersOnGroups.count({
        where,
      }),
    ])

    return {
      data: data.map((item) => ({
        ...item,
        user: { profile: item.user.profile, isOnline: !!item.user.wsId },
      })),
      meta: {
        total,
        page,
        take,
      },
    }
  }

  @ApiOperation({
    summary: "Cập nhật thông tin group",
  })
  @Patch(":groupId")
  async updateGroup(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Body() data: UpdateGroupDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
        ownerId: userId,
      },
    })
    if (!group)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    return this.prismaService.group.update({
      data,
      where: {
        id: groupId,
      },
    })
  }

  @ApiOperation({
    summary: "Xóa thành viên nhóm",
  })
  @Delete(":groupId/members/:deleteUserId")
  async deleteGroupMember(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("deleteUserId", ParseUUIDPipe) deleteUserId: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
        ownerId: userId,
      },
    })
    if (!group || userId === deleteUserId)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    const userOnGroup = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId: deleteUserId,
          groupId,
        },
      },
    })
    if (!userOnGroup) throw new BadRequestException("User isn't group member")
    return this.prismaService.usersOnGroups.delete({
      where: {
        userId_groupId: {
          userId: deleteUserId,
          groupId,
        },
      },
    })
  }

  @ApiOperation({
    summary: "Rời nhóm",
  })
  @Post(":groupId/leave")
  async leaveGroup(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const [userOnGroup, countGroupMember] =
      await this.prismaService.$transaction([
        this.prismaService.usersOnGroups.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId,
            },
          },
        }),
        this.prismaService.usersOnGroups.count({
          where: {
            groupId,
          },
        }),
      ])

    if (!userOnGroup) throw new BadRequestException("You're not group member")
    if (userOnGroup.isOwner && countGroupMember > 1)
      throw new BadRequestException("You're group owner")
    return this.prismaService.usersOnGroups.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })
  }

  @ApiOperation({
    summary: "Tạo invite code",
  })
  @Post(":groupId/invite-code")
  async createGroupInviteCode(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Body() data: CreateGroupInviteCodeDto,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
        ownerId: userId,
      },
    })
    if (!group)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )

    return this.prismaService.group.update({
      where: { id: groupId },
      data: {
        inviteCode: generateCode(),
        inviteCodeNumberOfUses: 0,
        inviteCodeMaxNumberOfUses: data.inviteCodeMaxNumberOfUses,
      },
    })
  }

  @ApiOperation({
    summary: "Tham gia nhóm bằng invite code",
  })
  @Post("join/:inviteCode")
  async joinGroup(
    @Param("inviteCode") inviteCode: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.group.findFirst({
      where: {
        inviteCode,
      },
    })
    if (!group)
      throw new BadRequestException("Group invite code does not exist")

    const userOnGroup = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: group.id,
        },
      },
    })
    if (userOnGroup) throw new BadRequestException("You're group member")

    if (group.inviteCodeMaxNumberOfUses) {
      if (group.inviteCodeNumberOfUses + 1 < group.inviteCodeMaxNumberOfUses)
        await this.prismaService.group.update({
          where: {
            id: group.id,
          },
          data: {
            inviteCodeNumberOfUses: {
              increment: 1,
            },
          },
        })
      else
        await this.prismaService.group.update({
          where: {
            id: group.id,
          },
          data: {
            inviteCode: generateCode(),
            inviteCodeNumberOfUses: 0,
          },
        })
    }

    return this.prismaService.usersOnGroups.create({
      data: {
        userId,
        groupId: group.id,
        isOwner: false,
      },
    })
  }

  @ApiOperation({
    summary: "Lấy thông tin nhóm bằng invite code",
  })
  @Post("check-invite-code/:inviteCode")
  async checkGroupInviteCode(
    @Param("inviteCode") inviteCode: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.group.findFirst({
      where: {
        inviteCode,
      },
      include: {
        owner: {
          select: {
            profile: true,
          },
        },
      },
    })
    if (!group)
      throw new BadRequestException("Group invite code does not exist")

    const userOnGroup = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: group.id,
        },
      },
    })
    if (userOnGroup) throw new BadRequestException("You're group member")

    return group
  }

  @ApiOperation({
    summary: "Chuyển quyền sở hữu nhóm",
  })
  @Post(":groupId/transfer-ownership/:targetId")
  async groupTransferOwnership(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("targetId", ParseUUIDPipe) targetUserId: string,
    @CurrentUser({ field: "id" }) userId: string,
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
        ownerId: userId,
      },
    })
    if (!group || userId === targetUserId)
      throw new BadRequestException(
        "Group doesn't exist or you don't have permission",
      )
    const userOnGroup = await this.prismaService.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    })
    if (!userOnGroup) throw new BadRequestException("User isn't group member")

    const countOwnGroup = await this.prismaService.group.count({
      where: {
        ownerId: targetUserId,
      },
    })
    if (countOwnGroup >= 10)
      throw new BadRequestException("User can only own a maximum of 10 groups")

    const [updatedGroup] = await this.prismaService.$transaction([
      this.prismaService.group.update({
        where: {
          id: groupId,
        },
        data: {
          ownerId: targetUserId,
        },
      }),
      this.prismaService.usersOnGroups.update({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
        data: {
          isOwner: false,
        },
      }),
      this.prismaService.usersOnGroups.update({
        where: {
          userId_groupId: {
            userId: targetUserId,
            groupId,
          },
        },
        data: {
          isOwner: true,
        },
      }),
    ])
    return updatedGroup
  }
}
