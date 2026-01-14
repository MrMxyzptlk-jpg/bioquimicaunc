export class CreateCommentDto {
    content: string;
    user: string;
    postId: number;
    parentId?: number;
}
