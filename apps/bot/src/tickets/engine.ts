import { prisma } from '@dmb/prisma';
import { Guild, TextChannel, ChannelType, PermissionFlagsBits, User } from 'discord.js';

export class TicketError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function createTicket(
  guild: Guild,
  user: User,
  categoryId: string
): Promise<{ ticketId: bigint; channel: TextChannel }> {
  const guildIdBig = BigInt(guild.id);
  const userIdBig = BigInt(user.id);
  const categoryIdBig = BigInt(categoryId);

  const category = await prisma.ticketCategory.findUnique({
    where: { id: categoryIdBig },
  });

  if (!category || category.guildId !== guildIdBig) {
    throw new TicketError('CategoryNotFound', 'Ticket category not found');
  }

  const openCount = await prisma.ticket.count({
    where: { guildId: guildIdBig, userId: userIdBig, status: 'open' },
  });

  if (openCount >= category.maxOpen) {
    throw new TicketError('MaxOpenTickets', 'You have reached the maximum open tickets');
  }

  const parent = category.parentChannelId ? category.parentChannelId.toString() : undefined;

  const channel = await guild.channels.create({
    name: `ticket-${user.username}-${Date.now().toString(36)}`,
    type: ChannelType.GuildText,
    parent: parent,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
    ],
  });

  const ticket = await prisma.ticket.create({
    data: {
      guildId: guildIdBig,
      userId: userIdBig,
      categoryId: categoryIdBig,
      channelId: BigInt(channel.id),
      status: 'open',
    },
  });

  await channel.send(`Hello <@${user.id}>, support will be with you shortly.`);

  return { ticketId: ticket.id, channel };
}

export async function closeTicket(
  guild: Guild,
  ticketId: string,
  closedBy: User
): Promise<{ ticketId: bigint; transcriptUrl?: string }> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: BigInt(ticketId) },
  });

  if (!ticket || ticket.guildId !== BigInt(guild.id)) {
    throw new TicketError('TicketNotFound', 'Ticket not found');
  }
  if (ticket.status !== 'open') {
    throw new TicketError('AlreadyClosed', 'Ticket is already closed');
  }

  const channel = ticket.channelId ? guild.channels.cache.get(ticket.channelId.toString()) as TextChannel | undefined : undefined;

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: 'closed',
      closedAt: new Date(),
      closedBy: BigInt(closedBy.id),
    },
  });

  if (channel?.deletable) {
    await channel.delete('Ticket closed').catch(() => null);
  }

  return { ticketId: ticket.id };
}
