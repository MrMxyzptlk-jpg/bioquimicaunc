import { Controller, Get, Post, Body, Patch, Param, Delete, Header, Session, UnauthorizedException, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';

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
        if (!session.userId) return `<div class="error"> Login required </div>`;

        const user = await this.usersRepo.findOneBy({ id: session.userId });
        if (!user) throw new UnauthorizedException();

        const newComment = await this.commentsService.create(createCommentDto, user);
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

        const paddingLeft = level * 10; // level-based indent

        const authorName = comment.author ? comment.author.name : 'Anónimo';

        return `
            <div class="comment-wrapper" style="padding-left: ${paddingLeft}px;">
                <div class="comment-content">
                    <strong> ${authorName} | ${new Date(comment.createdAt).toLocaleDateString()} </strong> ${comment.content}
                </div>

                <details>
                    <summary> Responder </summary>

                    <form hx-post="/comments"
                        hx-target="#children-container-${comment.id}"
                        hx-swap="beforeend"
                        hx-on::after-request="this.reset(); this.closest('details').removeAttribute('open');"
                        class="comment-form">

                        <input type="hidden" name="postId" value="${comment.post ? comment.post.id : comment.postId}">
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

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.commentsService.findOne(+id);
    }

    @UseGuards(AuthenticatedGuard)
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @Session() session: Record<string, any>
    ) {
        const comment = await this.commentsService.findOne(+id);

        if (!comment) {
            throw new NotFoundException('Comentario no encontrado');
        }

        if (comment.author.id !== session.userId) {
            throw new ForbiddenException('No puedes borrar este comentario');
        }

        return this.commentsService.update(+id, updateCommentDto);
    }

    @UseGuards(AuthenticatedGuard)
    @Delete(':id')
    async remove(
        @Param('id') id: string,
        @Session() session: Record<string, any>
    ) {
        const comment = await this.commentsService.findOne(+id);

        if (!comment) {
            throw new NotFoundException('Comentario no encontrado');
        }

        if (comment.author.id !== session.userId) {
            throw new ForbiddenException('No puedes borrar este comentario');
        }

        return this.commentsService.remove(+id);
    }
}
