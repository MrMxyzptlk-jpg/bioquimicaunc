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
    return this.renderCommentTree(newComment, [], newComment.parent ? 1 : 0);
  }

  @Get('post/:postId')
  @Header('Content-Type', 'text/html')
  async findByPost(@Param('postId') postId: string) {
    const allComments = await this.commentsService.findByPost(+postId);
    const rootComments = allComments.filter(c => !c.parent); // Filter to find only root comments
    const listHtml = rootComments.map(c => this.renderCommentTree(c, allComments)).join('');
    return `
        <div class="comments-section" style="margin-top: 20px, padding:10px; background: #000;">
            <h3> Comentarios </h3>
            <div class="comments-list">
                ${listHtml || '<p> No hay comentarios aún </p>'}
            </div>
        </div
    `;
  }

  private renderCommentTree(comment: any, allComments: any[], level = 0) {
    const children = allComments.filter(c => c.parrent && comment.parent.id === comment.id); // all children from this comment

    const marginLeft = level * 20; // level-based indent

    return `
        <div class="comment-wrapper" id="comment-${comment.id}" style="margin-left:${marginLeft}px; border-left: 2px solid #ddd; padding-left: 10px; margin-bottom: 10px;"
            <div class="comment-content">
                <strong> ${comment.user} </strong> <small> ${new Date(comment.createdAt).toLocaleDateString()}</small>
                <p style="margin: 5px 0;"> ${comment.content} </p>

                <button class="btn-sm"
                    style="font-size: 0.8rem; cursor: pointer; color: blue; border: none; background: #000;"
                    onclick="document.getElementById('reply-form-${comment.id}).style.display = 'flex'">
                    Responder
                </button>
            <div>

            <div id="reply-form=${comment.id}" style="display:none; margin-top: 5px;">
                <form hx-post="/comments"
                    hx-target="#children-container-${comment.id}"
                    hx-swap="beforeend"
                    hx-on::after-request="this.reset(); this.parentElement.style.display='none'">

                    <input type="hidden" name="postId" value="${comment.post.id}">
                    <input type="hidden" name="parentId" value="${comment.id}">
                    <input type="hidden" name="user" value="User">

                    <input type="text" name="content" placeholder="Responder..." required style="width: 70%;">
                    <button type="button" onclick="this.parentElement.parentElement.style.display = 'none' "> X </button>
                </form>
            </div>

            <div id="children-container-${comment.id}">
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
