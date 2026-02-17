import { Controller, Get, Post, Body, Patch, Param, Delete, Header, Session, UnauthorizedException, UseGuards, ForbiddenException, NotFoundException, ParseIntPipe, HttpCode, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { timeAgo } from '../utils/time';

import { Comment } from './entities/comment.entity'
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { Throttle } from '@nestjs/throttler';
import { escapeHtml } from '../utils/escapeHtml';

@Controller('comments')
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {}

    @UseGuards(AuthenticatedGuard)
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 comments/min max
    @Post()
    @Header('Content-Type', 'text/html')
    async create(@Body() createCommentDto: CreateCommentDto, @Session() session: Record<string, any>) {
        if (!session.userId) return `<div class="error"> Se necesita sesión iniciada </div>`;

        const user = await this.usersRepo.findOneBy({ id: session.userId });
        if (!user) throw new UnauthorizedException();

        const newComment = await this.commentsService.create(createCommentDto, user);
        return this.renderSingleComment(newComment, session?.userId);
    }

    @Throttle({ default: { limit: 30, ttl: 60000 } })
    @Get('post/:postId')
    @Header('Content-Type', 'text/html')
    async findByPost(
        @Param('postId') postId: string,
        @Session() session: Record<string, any>
    ) {
        const allComments = await this.commentsService.findByPost(+postId);
        // parentId -> children[]
        const childrenMap = new Map<number, Comment[]>();
        const rootComments: Comment[] = [];

        for (const comment of allComments) {
            if (!comment.parent) {
                rootComments.push(comment);
            } else {
                const parentId = comment.parent.id;
                const arr = childrenMap.get(parentId) ?? [];
                arr.push(comment);
                childrenMap.set(parentId, arr);
            }
        }

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

        return hideButton + rootComments.map(c => this.renderCommentTree(c, childrenMap, session?.userId)).join('');
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
        return this.renderSingleComment(deletedComment, session.userId);
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
                    class="comment-form">

                    <textarea
                        name="content"
                        required
                        data-maxlength="1000"
                        maxlength="1000">${escapeHtml(comment.content)}</textarea>
                    <small class="char-counter"></small>

                    <div class="comment-actions">
                        <button type="button"
                            hx-get="/comments/${comment.id}"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML">
                            Cancelar
                        </button>
                        <button type="submit"> Guardar </button>
                    </div>
                </form>
            </div>
        `
    }

    @UseGuards(AuthenticatedGuard)
    @Put(':id')
    @Header('Content-Type', 'text/html')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 edits/min max
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
        const isEdited = updated.getTime() > (created.getTime() + 100); // 1s buffer

        return `
            <div class="comment-wrapper" id="comment-${comment.id}">
                <div class="comment-content" style="margin-left: 10px;">
                    <small class="comment-details">
                        <strong>${escapeHtml(comment.author.name)}</strong> | ${timeAgo(comment.createdAt)}
                        ${ isEdited ? `[Editado: ${timeAgo(comment.updatedAt)}]` : ''}
                    </small>
                    <p class="${isDeleted ? 'text-muted' : ''}">${escapeHtml(comment.content)}</p>

                </div>
                <div class="comment-actions">
                    ${canEdit ? `
                        <button
                            hx-delete="/comments/${comment.id}"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML"
                            hx-confirm="¿Borrar comentario?">
                            Eliminar
                        </button>
                        <button
                            hx-get="/comments/${comment.id}/edit"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML">
                            Editar
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
        childrenMap: Map<number, Comment[]>,
        userId?: number,
        level = 0
    ) {
        const children = childrenMap.get(comment.id) ?? [];
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
                        <strong> ${escapeHtml(comment.author.name)} </strong> | ${timeAgo(comment.createdAt)}
                        ${ wasEdited ? `[Editado: ${timeAgo(comment.updatedAt)}]` : ''}
                    </small>
                    <p class="${isDeleted ? 'text-muted' : ''}">${escapeHtml(comment.content)}</p>
                </div>

                ${ canEdit ? `
                    <div class="comment-actions">
                        <button
                            hx-delete="/comments/${comment.id}"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML"
                            hx-confirm="¿Borrar comentario?">
                            Eliminar
                        </button>

                        <button
                            hx-get="/comments/${comment.id}/edit"
                            hx-target="#comment-${comment.id}"
                            hx-swap="outerHTML">
                            Editar
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
                                data-maxlength="1000"
                                maxlength="1000"></textarea>
                            <small class="char-counter"></small>
                            <button type="submit" style="font-size:0.8rem;"> Enviar </button>
                        </form>
                    </details>
                ` : ''}

                <div id="children-container-${comment.id}">
                    ${children.map(child => this.renderCommentTree(child, childrenMap, userId, level + 1)).join('')}
                </div>

            </div>
        `;
    }
}
