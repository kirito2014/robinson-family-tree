'use server';

import { prisma } from '../lib/prisma';
import { FamilyMember, Connection } from '../types';

// --- Members ---

export async function getMembersAction(): Promise<FamilyMember[]> {
  const members = await prisma.member.findMany();
  return members.map(m => ({
    ...m,
    gender: m.gender as 'male' | 'female',
    // Ensure standard types match frontend expectation
  }));
}

export async function saveMemberAction(member: FamilyMember) {
  const { id, ...data } = member;
  
  // If setting isSelf=true, we need to unset others first (transactionally would be better, but simplified here)
  if (data.isSelf) {
    await prisma.member.updateMany({
      where: { isSelf: true, id: { not: id } },
      data: { isSelf: false }
    });
  }

  await prisma.member.upsert({
    where: { id },
    update: {
      name: data.name,
      nameZh: data.nameZh,
      role: data.role,
      birthDate: data.birthDate,
      deathDate: data.deathDate,
      location: data.location,
      avatar: data.avatar,
      bio: data.bio,
      gender: data.gender,
      isSelf: data.isSelf,
      x: data.x,
      y: data.y
    },
    create: {
      id,
      name: data.name,
      nameZh: data.nameZh,
      role: data.role,
      birthDate: data.birthDate,
      deathDate: data.deathDate,
      location: data.location,
      avatar: data.avatar,
      bio: data.bio,
      gender: data.gender,
      isSelf: data.isSelf ?? false,
      x: data.x,
      y: data.y
    }
  });
}

export async function deleteMemberAction(id: string) {
  await prisma.$transaction([
    // Delete all connections related to this member
    prisma.connection.deleteMany({
      where: {
        OR: [
          { sourceId: id },
          { targetId: id }
        ]
      }
    }),
    // Delete the member itself
    prisma.member.delete({
      where: { id }
    })
  ]);
}

// Export a transactional version for explicit use
export async function deleteMemberWithConnectionsAction(id: string) {
  return deleteMemberAction(id);
}

// --- Connections ---

export async function getConnectionsAction(): Promise<Connection[]> {
  const connections = await prisma.connection.findMany();
  return connections.map(c => {
    const connection: Connection = {
      ...c,
      sourceHandle: c.sourceHandle as any,
      targetHandle: c.targetHandle as any,
      lineStyle: c.lineStyle as any
    };
    
    // Parse arrowOptions from extra field if it exists
    if (c.extra) {
      try {
        const extraData = JSON.parse(c.extra);
        if (extraData.type || extraData.size || extraData.direction) {
          connection.arrowOptions = extraData;
        }
      } catch (e) {
        console.error('Failed to parse connection extra data:', e);
      }
    }
    
    return connection;
  });
}

export async function saveConnectionAction(conn: Connection) {
  const { id, arrowOptions, ...data } = conn;
  
  await prisma.connection.upsert({
    where: { id },
    update: {
      sourceId: data.sourceId,
      targetId: data.targetId,
      sourceHandle: data.sourceHandle,
      targetHandle: data.targetHandle,
      label: data.label,
      labelZh: data.labelZh,
      color: data.color,
      lineStyle: data.lineStyle,
      extra: arrowOptions ? JSON.stringify(arrowOptions) : null
    },
    create: {
      id,
      sourceId: data.sourceId,
      targetId: data.targetId,
      sourceHandle: data.sourceHandle,
      targetHandle: data.targetHandle,
      label: data.label,
      labelZh: data.labelZh,
      color: data.color,
      lineStyle: data.lineStyle,
      extra: arrowOptions ? JSON.stringify(arrowOptions) : null
    }
  });
}

export async function deleteConnectionAction(id: string) {
  await prisma.connection.delete({
    where: { id }
  });
}
