import { Controller, Get, Post, Body, Patch, Param, Delete, Header } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @Header('Content-Type', 'text/html')
  async create(@Body() createCommentDto: CreateCommentDto) {
    const newComment = await this.commentsService.create(createCommentDto);
    return `
        <div class="alert alert-secondary p-2 mb-2" id="comment-${newComment.id}">
            <strong> ${newComment.user}: </strong> ${newComment.content}
        </div>
    `
  }

  @Get('post/:postId')
  @Header('Content-Type', 'text/html')
  async findByPost(@Param('postId') postId: string) {
    const allComments = await this.commentsService.findByPost(+postId);
    const rootComments = allComments.filter(c => !c.parent); // Filter to find only root comments

    if (rootComments.length === 0 ) return '';

    return rootComments.map(c => this.renderCommentTree(c, allComments)).join('');
  }

  private renderCommentTree(comment: any, allComments: any[], level = 0) {
    const children = allComments.filter(c => c.parent && comment.parent.id === comment.id); // all children from this comment

    const marginLeft = level * 20; // level-based indent

    return `
        <div class="comment-wrapper" style="margin-left: ${marginLeft}px; margin-bottom: 5px;">
            <div class="alert alert-secondary p-2 mb-2">
                <strong> ${comment.user} | ${new Date(comment.createdAt).toLocaleDateString()} </strong> ${comment.content}
            </div>
            ${children.map(child => this.renderCommentTree(child, allComments, level + 1)).join('')}
        </div>
    `;
  }

  private renderMainForm(postId: number) {
    return `
        <hr>
        <form hx-post="/comments"
            hx-target=".comments-list"
            hx-swap="beforeend"
            hx-on::after-request="this.reset()">
            <input type="hidden" name="postId" value="${postId}">
            <input type="hidden" name="user" value="User">
            <textarea name="content" placeholder="Escribe un comentario nuevo..." required></textarea>
            <button type="submit" class="subject-btn"> Comentar </button>
        </form>
    `;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(+id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(+id);
  }
}
