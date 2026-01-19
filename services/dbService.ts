import { FamilyMember, Connection } from '../types';
import { 
  getMembersAction, 
  saveMemberAction, 
  deleteMemberAction, 
  getConnectionsAction, 
  saveConnectionAction, 
  deleteConnectionAction 
} from '../app/actions';

// This service now acts as a bridge to Server Actions
// Note: All methods are now ASYNC

export const dbService = {
  getMembers: async (): Promise<FamilyMember[]> => {
    try {
      return await getMembersAction();
    } catch (e) {
      console.error("Failed to fetch members", e);
      return [];
    }
  },

  addMember: async (member: FamilyMember) => {
    await saveMemberAction(member);
  },

  updateMember: async (member: FamilyMember) => {
    await saveMemberAction(member);
  },

  deleteMember: async (id: string) => {
    await deleteMemberAction(id);
  },

  // Batch Operations
  batchDeleteMembers: async (ids: string[]) => {
    for (const id of ids) {
      await deleteMemberAction(id);
    }
  },

  getConnections: async (): Promise<Connection[]> => {
    try {
      return await getConnectionsAction();
    } catch (e) {
      console.error("Failed to fetch connections", e);
      return [];
    }
  },

  addConnection: async (conn: Connection) => {
    await saveConnectionAction(conn);
  },

  updateConnection: async (conn: Connection) => {
    await saveConnectionAction(conn);
  },

  deleteConnection: async (id: string) => {
    await deleteConnectionAction(id);
  },

  // Export Logic needs to be client-side generated from fetched data, 
  // or moved to a server action that returns the string.
  // For simplicity, we assume the caller has the data or we fetch it here.
  exportAsSql: async () => {
    const members = await getMembersAction();
    const connections = await getConnectionsAction();
    
    let sql = `-- Robinson Family Tree Export\n-- Generated on ${new Date().toISOString()}\n\n`;
    
    sql += `CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT,
      name_zh TEXT,
      role TEXT,
      birth_date TEXT,
      location TEXT,
      avatar TEXT,
      gender TEXT,
      is_self BOOLEAN,
      x INTEGER,
      y INTEGER
    );\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      target_id TEXT,
      source_handle TEXT,
      target_handle TEXT,
      label TEXT,
      label_zh TEXT,
      color TEXT,
      line_style TEXT,
      FOREIGN KEY(source_id) REFERENCES members(id),
      FOREIGN KEY(target_id) REFERENCES members(id)
    );\n\n`;

    members.forEach(m => {
      sql += `INSERT INTO members (id, name, name_zh, role, birth_date, location, avatar, gender, is_self, x, y) VALUES ('${m.id}', '${m.name.replace(/'/g, "''")}', '${(m.nameZh||'').replace(/'/g, "''")}', '${m.role}', '${m.birthDate||''}', '${m.location||''}', '${m.avatar}', '${m.gender}', ${m.isSelf ? 1 : 0}, ${Math.round(m.x)}, ${Math.round(m.y)});\n`;
    });
    sql += '\n';

    connections.forEach(c => {
      sql += `INSERT INTO connections (id, source_id, target_id, source_handle, target_handle, label, label_zh, color, line_style) VALUES ('${c.id}', '${c.sourceId}', '${c.targetId}', '${c.sourceHandle}', '${c.targetHandle}', '${c.label}', '${c.labelZh||''}', '${c.color||'#e5e7eb'}', '${c.lineStyle||'solid'}');\n`;
    });

    return sql;
  },

  // Export as JSON
  exportAsJson: async () => {
    const members = await getMembersAction();
    const connections = await getConnectionsAction();
    
    const exportData = {
      members,
      connections,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        totalMembers: members.length,
        totalConnections: connections.length
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  },

  // Export as CSV
  exportAsCsv: async () => {
    const members = await getMembersAction();
    const connections = await getConnectionsAction();
    
    // Members CSV
    let membersCsv = 'id,name,name_zh,role,birth_date,location,avatar,gender,is_self,x,y\n';
    members.forEach(m => {
      membersCsv += `"${m.id}","${m.name.replace(/"/g, '""')}","${(m.nameZh||'').replace(/"/g, '""')}","${m.role}","${m.birthDate||''}","${m.location||''}","${m.avatar}","${m.gender}","${m.isSelf ? 'true' : 'false'}","${Math.round(m.x)}","${Math.round(m.y)}"\n`;
    });
    
    // Connections CSV
    let connectionsCsv = 'id,source_id,target_id,source_handle,target_handle,label,label_zh,color,line_style\n';
    connections.forEach(c => {
      connectionsCsv += `"${c.id}","${c.sourceId}","${c.targetId}","${c.sourceHandle}","${c.targetHandle}","${c.label.replace(/"/g, '""')}","${(c.labelZh||'').replace(/"/g, '""')}","${c.color||'#e5e7eb'}","${c.lineStyle||'solid'}"\n`;
    });
    
    return {
      members: membersCsv,
      connections: connectionsCsv
    };
  }
};
