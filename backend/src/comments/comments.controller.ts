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
    return this.renderCommentTree(newComment, []);
  }

  @Get('post/:postId')
  @Header('Content-Type', 'text/html')
  async findByPost(@Param('postId') postId: string) {
    const allComments = await this.commentsService.findByPost(+postId);
    const rootComments = allComments.filter(c => !c.parent); // Filter to find only root comments

    const hideButton = `
        <button
            hx-get="/posts/${postId}/comments-button"
            hx-target="#comments-list-${postId}"
            hx-swap="innerHTML"
            class="post-action-btn">
            Ocultar Comnetarios
        </button>
    `;

    if (rootComments.length === 0 ) return hideButton + '<p class="text-muted"> No hay comentarios aún. </p>';

    return hideButton + rootComments.map(c => this.renderCommentTree(c, allComments)).join('');
  }

  private renderCommentTree(comment: any, allComments: any[], level = 0) {
    const children = allComments.filter(c => c.parent && c.parent.id === comment.id); // all children from this comment

    const marginLeft = level * 20; // level-based indent

    return `
        <div class="comment-wrapper" style="margin-left: ${marginLeft}px;">
            <div class="comment-content">
                <strong> ${comment.user} | ${new Date(comment.createdAt).toLocaleDateString()} </strong> ${comment.content}
            </div>

            <details>
                <summary style="cursor: pointer; font-size: 0.8rem;">
                    Responder
                </summary>
                <form hx-post="/comments"
                    hx-target="#children-container-${comment.id}"
                    hx-swap="beforeend"
                    hx-on::after-request="this.reset(); this.closest('details').removeAttribute('open');"
                    style="margin-top: 5px; margin-bottom: 10px;">

                    <input type="hidden" name="postId" value="${comment.post ? comment.post.id : comment.postId}">
                    <input type="hidden" name="user" value="${comment.user}">
                    <input type="hidden" name="parentId" value="${comment.id}">

                    <input type="text" name="content" placeholder="Respuesta..." required>
                    <button type="submit" style="font-size:0.8rem;"> Enviar </button>
                </form>
            </details>

            <div id="children-container-${comment.id}">
                ${children.map(child => this.renderCommentTree(child, allComments, level + 1)).join('')}
            </div>
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
