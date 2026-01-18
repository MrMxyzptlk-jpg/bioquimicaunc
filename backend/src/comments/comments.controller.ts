import { Controller, Get, Post, Body, Patch, Param, Delete, Header, Session, UnauthorizedException, UseGuards, ForbiddenException, NotFoundException, ParseIntPipe, HttpCode, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';

import { Comment } from './entities/comment.entity'
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthenticatedGuard } from '../auth/authenticated.guard';

@Controller('comments')
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {}

    @UseGuards(AuthenticatedGuard)
    @Post()
    @Header('Content-Type', 'text/html')
    async create(@Body() createCommentDto: CreateCommentDto, @Session() session: Record<string, any>) {
        if (!session.userId) return `<div class="error"> Se necesita sesión iniciada </div>`;

        const user = await this.usersRepo.findOneBy({ id: session.userId });
        if (!user) throw new UnauthorizedException();

        const newComment = await this.commentsService.create(createCommentDto, user);
        return this.renderSingleComment(newComment, session?.userId);
    }

    @Get('post/:postId')
    @Header('Content-Type', 'text/html')
    async findByPost(
        @Param('postId') postId: string,
        @Session() session: Record<string, any>
    ) {
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

        return hideButton + rootComments.map(c => this.renderCommentTree(c, allComments, session?.userId)).join('');
    }

    @UseGuards(AuthenticatedGuard)
    @Delete(':id')
    @Header('Content-type', 'text/html')
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const comment = await this.commentsService.findOne(id);

        if (!comment) throw new NotFoundException();
        if (comment.author.id !== session.userId) throw new ForbiddenException();

        const deletedComment = await this.commentsService.remove(id);
        const allComments = await this.commentsService.findByPost(deletedComment.post.id);
        return this.renderCommentTree(deletedComment, allComments, session.userId);
    }

    @UseGuards(AuthenticatedGuard)
    @Get(':id/edit')
    @Header('Content-type', 'text/html')
    async editForm(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const comment = await this.commentsService.findOne(id);

        if (!comment) throw new NotFoundException();
        if (comment.author.id !== session.userId) throw new ForbiddenException();

        return `
            <div class="comment-wrapper" id="comment-${comment.id}">
                <form
                    hx-put="/comments/${comment.id}"
                    hx-target="#comment-${comment.id}"
                    hx-swap="outerHTML"
                    class="comment-edit-form">

                    <textarea
                        name="content"
                        required
                        data-maxlength="1000"
                        maxlength="1000">${comment.content}</textarea>
                    <small class="char-counter"></small>

                    <div class="comment-actions">
                        <button type="submit"> Guardar </button>
                        <button type="button"
                            hx-get="/comments/${comment.id}"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `
    }

    @UseGuards(AuthenticatedGuard)
    @Put(':id')
    @Header('Content-Type', 'text/html')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() UpdateCommentDto: UpdateCommentDto,
        @Session() session: Record<string, any>
    ) {
        const comment = await this.commentsService.findOne(id);

        if (!comment) throw new NotFoundException();
        if (comment.author.id !== session.userId) throw new ForbiddenException();

        const updatedComment = await this.commentsService.update(id, UpdateCommentDto);
        return this.renderSingleComment(updatedComment, session.userId);
    }

    @Get(':id')
    @Header('Content-Type', 'text/html')
    async fragment(@Param('id', ParseIntPipe) id: number, @Session() session) {
        const comment = await this.commentsService.findOne(id);
        if (!comment) throw new NotFoundException();

        return this.renderSingleComment(comment, session?.userId)
    }

    private renderSingleComment(comment: Comment, UserId?: number) {
        const isDeleted = comment.content === '[Comentario borrado]'
        const canEdit = (!isDeleted) && (comment.author?.id === UserId); //can edit if NOT deleted and current user is the author

        const created = new Date(comment.createdAt);
        const updated = new Date(comment.updatedAt);
        const wasEdited = updated.getTime() > (created.getTime() + 1000); // 1s buffer

        return `
            <div class="comment-wrapper" id="comment-${comment.id}">
                <div class="comment-content" style="margin-left: 10px;">
                    <small class="comment-details">
                        <strong>${comment.author.name}</strong> | ${new Date(comment.createdAt).toLocaleDateString()}
                        ${ wasEdited ? `[Editado: ${updated.toLocaleString()}]` : ''}
                    </small>
                    <p class="${isDeleted ? 'text-muted' : ''}">${comment.content}</p>

                </div>
                <div class="comment-actions">
                    ${canEdit ? `
                        <button
                            hx-get="/comments/${comment.id}/edit"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML">
                            Editar
                        </button>
                        <button
                            hx-delete="/comments/${comment.id}"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML"
                            hx-confirm="¿Borrar comentario?">
                            Eliminar
                        </button>
                    ` : ''}
                </div>
                <details>
                    <summary> Responder </summary>
                    <form
                        hx-post="/comments"
                        hx-target="#children-container-${comment.id}"
                        hx-swap="beforeend"
                        hx-on::after-request="this.reset(); this.closest('details').removeAttribute('open');"
                        class="comment-form">

                        <input type="hidden" name="postId" value="${comment.post.id}">
                        <input type="hidden" name="parentId" value="${comment.id}">
                        <textarea name="content" required data-maxlength="1000" maxlength="1000"></textarea>
                        <small class="char-counter"></small>
                        <button type="submit"> Enviar </button>
                    </form>
                </details>

                <div id="children-container-${comment.id}"></div>

            </div>
        `;
    }

    private renderCommentTree(
        comment: any,
        allComments: any[],
        userId?: number,
        level = 0
    ) {
        const children = allComments.filter(c => c.parent && c.parent.id === comment.id); // all children from this comment

        const paddingLeft = level * 15; // level-based indent

        const isDeleted = comment.content === '[Comentario borrado]';
        const canEdit = !isDeleted && (comment.author?.id === userId);

        const created = new Date(comment.createdAt);
        const updated = new Date(comment.updatedAt);
        // Compare times
        const wasEdited = updated.getTime() > (created.getTime() + 1000);

        return `
            <div class="comment-wrapper" id="comment-${comment.id}">
                <div class="comment-content" style="padding-left: ${paddingLeft}px;">
                    <small class="comment-details">
                        <strong> ${comment.author.name} </strong> | ${new Date(comment.createdAt).toLocaleDateString()}
                        ${ wasEdited ? `[Editado: ${updated.toLocaleString()}]` : ''}
                    </small>
                    <p class="${isDeleted ? 'text-muted' : ''}">${comment.content}</p>
                </div>

                ${ canEdit ? `
                    <div class="comment-actions">
                        <button
                            hx-get="/comments/${comment.id}/edit"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML">
                            Editar
                        </button>

                        <button
                            hx-delete="/comments/${comment.id}"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML"
                            hx-confirm="¿Borrar comentario?">
                            Eliminar
                        </button>
                    </div>
                ` : ''}

                ${ !isDeleted ? `
                    <details>
                        <summary> Responder </summary>

                        <form hx-post="/comments"
                            hx-target="#children-container-${comment.id}"
                            hx-swap="beforeend"
                            hx-on::after-request="this.reset(); this.closest('details').removeAttribute('open');"
                            class="comment-form">

                            <input type="hidden" name="postId" value="${comment.post ? comment.post.id : comment.postId}">
                            <input type="hidden" name="parentId" value="${comment.id}">

                            <textarea
                                type="text"
                                name="content"
                                placeholder="Respuesta..."
                                required
                                data-maxlength="800"
                                maxlength="800"></textarea>
                            <small class="char-counter"></small>
                            <button type="submit" style="font-size:0.8rem;"> Enviar </button>
                        </form>
                    </details>
                ` : ''}

                <div id="children-container-${comment.id}">
                    ${children.map(child => this.renderCommentTree(child, allComments, userId, level + 1)).join('')}
                </div>

            </div>
        `;
    }
}
