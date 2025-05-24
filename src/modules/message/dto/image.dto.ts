export interface ImageDto {
  id: string
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  imageUrl: string
  imageKey: string
  userId: string
  directMessageChannelId: string
}
