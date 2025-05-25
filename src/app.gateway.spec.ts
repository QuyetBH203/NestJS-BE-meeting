import { Test, TestingModule } from "@nestjs/testing"
import { Socket } from "socket.io"
import { AppGateway } from "./app.gateway"
import { AuthService } from "./modules/auth/auth.service"
import { PrismaService } from "./modules/prisma/prisma.service"
import { WsGuard } from "./modules/auth/guards/ws.guard"
import { UserProvider, User } from "@prisma/client"

// Create a type for the mocked PrismaService
type MockPrismaService = {
  user: {
    update: jest.Mock
  }
}

describe("AppGateway", () => {
  let gateway: AppGateway
  let authService: jest.Mocked<AuthService>
  let prismaService: MockPrismaService
  let mockSocket: jest.Mocked<Socket>
  beforeEach(async () => {
    const mockAuthService = {
      getUserFromSocket: jest.fn(),
    }

    const mockPrismaService: MockPrismaService = {
      user: {
        update: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppGateway,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideGuard(WsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile()

    gateway = module.get<AppGateway>(AppGateway)
    authService = module.get(AuthService)
    prismaService = module.get<MockPrismaService>(PrismaService)

    // Mock Socket
    mockSocket = {
      id: "socket-123",
      disconnect: jest.fn(),
      handshake: {
        auth: {
          accessToken: "valid-token",
        },
      },
    } as any
  })

  it("should be defined", () => {
    expect(gateway).toBeDefined()
  })
  describe("handleConnection", () => {
    it("should update user wsId when user is authenticated", async () => {
      const mockUser: User = {
        id: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        provider: UserProvider.GOOGLE,
        email: "test@example.com",
        refreshToken: "refresh-token",
        wsId: null,
        facebookId: null,
      }

      authService.getUserFromSocket.mockResolvedValue(mockUser)
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        wsId: mockSocket.id,
      })

      await gateway.handleConnection(mockSocket)

      expect(authService.getUserFromSocket).toHaveBeenCalledWith(mockSocket)
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
        data: {
          wsId: mockSocket.id,
        },
      })
      expect(mockSocket.disconnect).not.toHaveBeenCalled()
    })

    it("should disconnect client when user is not authenticated", async () => {
      authService.getUserFromSocket.mockResolvedValue(null)

      await gateway.handleConnection(mockSocket)

      expect(authService.getUserFromSocket).toHaveBeenCalledWith(mockSocket)
      expect(prismaService.user.update).not.toHaveBeenCalled()
      expect(mockSocket.disconnect).toHaveBeenCalled()
    })

    it("should throw error when getUserFromSocket throws error", async () => {
      authService.getUserFromSocket.mockRejectedValue(
        new Error("Invalid token"),
      )

      await expect(gateway.handleConnection(mockSocket)).rejects.toThrow(
        "Invalid token",
      )

      expect(authService.getUserFromSocket).toHaveBeenCalledWith(mockSocket)
      expect(prismaService.user.update).not.toHaveBeenCalled()
      expect(mockSocket.disconnect).not.toHaveBeenCalled()
    })

    it("should throw error when database update fails", async () => {
      const mockUser = {
        id: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        provider: UserProvider.GOOGLE,
        email: "test@example.com",
        refreshToken: "refresh-token",
        wsId: null,
        facebookId: null,
      }

      authService.getUserFromSocket.mockResolvedValue(mockUser)
      prismaService.user.update.mockRejectedValue(new Error("Database error"))

      await expect(gateway.handleConnection(mockSocket)).rejects.toThrow(
        "Database error",
      )

      expect(authService.getUserFromSocket).toHaveBeenCalledWith(mockSocket)
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
        data: {
          wsId: mockSocket.id,
        },
      })
    })
  })

  describe("handleDisconnect", () => {
    it("should set user wsId to null when user is authenticated", async () => {
      const mockUser = {
        id: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        provider: UserProvider.GOOGLE,
        email: "test@example.com",
        refreshToken: "refresh-token",
        wsId: mockSocket.id,
        facebookId: null,
      }

      authService.getUserFromSocket.mockResolvedValue(mockUser)
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        wsId: null,
      } as any)

      await gateway.handleDisconnect(mockSocket)

      expect(authService.getUserFromSocket).toHaveBeenCalledWith(mockSocket)
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
        data: {
          wsId: null,
        },
      })
    })

    it("should not update database when user is not authenticated", async () => {
      authService.getUserFromSocket.mockResolvedValue(null)

      await gateway.handleDisconnect(mockSocket)

      expect(authService.getUserFromSocket).toHaveBeenCalledWith(mockSocket)
      expect(prismaService.user.update).not.toHaveBeenCalled()
    })

    it("should throw error when getUserFromSocket throws error", async () => {
      authService.getUserFromSocket.mockRejectedValue(
        new Error("Invalid token"),
      )

      await expect(gateway.handleDisconnect(mockSocket)).rejects.toThrow(
        "Invalid token",
      )

      expect(authService.getUserFromSocket).toHaveBeenCalledWith(mockSocket)
      expect(prismaService.user.update).not.toHaveBeenCalled()
    })

    it("should handle database update errors gracefully", async () => {
      const mockUser = {
        id: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        provider: UserProvider.GOOGLE,
        email: "test@example.com",
        refreshToken: "refresh-token",        wsId: mockSocket.id,
        facebookId: null,
      }
      
      authService.getUserFromSocket.mockResolvedValue(mockUser)
      prismaService.user.update.mockRejectedValue(new Error("Database error"))

      await expect(gateway.handleDisconnect(mockSocket)).rejects.toThrow(
        "Database error",
      )

      expect(authService.getUserFromSocket).toHaveBeenCalledWith(mockSocket)
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
        data: {
          wsId: null,
        },
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle multiple rapid connections from same user", async () => {
      const mockUser = {
        id: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        provider: UserProvider.GOOGLE,
        email: "test@example.com",
        refreshToken: "refresh-token",
        wsId: null,
        facebookId: null,
      }

      const socket1 = { ...mockSocket, id: "socket-1" } as any
      const socket2 = { ...mockSocket, id: "socket-2" } as any

      authService.getUserFromSocket.mockResolvedValue(mockUser)
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        wsId: "socket-2",
      } as any)

      // Simulate rapid connections
      await Promise.all([
        gateway.handleConnection(socket1),
        gateway.handleConnection(socket2),
      ])

      expect(authService.getUserFromSocket).toHaveBeenCalledTimes(2)
      expect(prismaService.user.update).toHaveBeenCalledTimes(2)
    })

    it("should handle connection and disconnection in quick succession", async () => {
      const mockUser = {
        id: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        provider: UserProvider.GOOGLE,
        email: "test@example.com",
        refreshToken: "refresh-token",
        wsId: null,
        facebookId: null,
      }

      authService.getUserFromSocket.mockResolvedValue(mockUser)
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        wsId: null,
      } as any)

      // Simulate quick connection then disconnection
      await gateway.handleConnection(mockSocket)
      await gateway.handleDisconnect(mockSocket)

      expect(authService.getUserFromSocket).toHaveBeenCalledTimes(2)
      expect(prismaService.user.update).toHaveBeenNthCalledWith(1, {
        where: { id: mockUser.id },
        data: { wsId: mockSocket.id },
      })
      expect(prismaService.user.update).toHaveBeenNthCalledWith(2, {
        where: { id: mockUser.id },
        data: { wsId: null },
      })
    })
  })

  describe("Integration scenarios", () => {
    it("should maintain user online status correctly", async () => {
      const mockUser = {
        id: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        provider: UserProvider.GOOGLE,
        email: "test@example.com",
        refreshToken: "refresh-token",
        wsId: null,
        facebookId: null,
      }

      authService.getUserFromSocket.mockResolvedValue(mockUser)

      // User connects
      prismaService.user.update.mockResolvedValueOnce({
        ...mockUser,
        wsId: mockSocket.id,
      } as any)

      await gateway.handleConnection(mockSocket)

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { wsId: mockSocket.id },
      })

      // User disconnects
      prismaService.user.update.mockResolvedValueOnce({
        ...mockUser,
        wsId: null,
      } as any)

      await gateway.handleDisconnect(mockSocket)

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { wsId: null },
      })

      expect(prismaService.user.update).toHaveBeenCalledTimes(2)
    })
  })
})
