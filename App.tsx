"use client";

import React, { useState, useEffect } from 'react';
import { ViewMode, FamilyMember, Connection } from './types';
import { dbService } from './services/dbService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './src/providers/ToastProvider';
import { useUndoRedo } from './src/providers/UndoRedoProvider';
import Navbar from './components/Navbar';
import TreeView from './views/TreeView';
import DirectoryView from './views/DirectoryView';
import SettingsView from './views/SettingsView';
import ProfileSidebar from './components/ProfileSidebar';
import Timeline from './components/Timeline';
import EditMemberModal from './components/EditMemberModal';
import EditConnectionModal from './components/EditConnectionModal';

const App: React.FC = () => {
    const [currentView, setView] = useState<ViewMode>('tree');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [showChineseNames, setShowChineseNames] = useState(false);
    const queryClient = useQueryClient();
    const toast = useToast();
    const { addOperation, undo, redo, canUndo, canRedo } = useUndoRedo();

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (canUndo) {
                    undo();
                    toast.showInfo('Undo operation');
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                if (canRedo) {
                    redo();
                    toast.showInfo('Redo operation');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo, toast]);

    // Modal State
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
    const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);

    // --- Data Queries ---

    const { data: members = [], isLoading: membersLoading } = useQuery({
        queryKey: ['members'],
        queryFn: () => dbService.getMembers(),
    });

    const { data: connections = [], isLoading: connectionsLoading } = useQuery({
        queryKey: ['connections'],
        queryFn: () => dbService.getConnections(),
    });

    const loading = membersLoading || connectionsLoading;

    // --- Mutations ---

    const saveMemberMutation = useMutation({
        mutationFn: (member: FamilyMember) => {
            const existing = members.find(m => m.id === member.id);
            if (existing) {
                return dbService.updateMember(member);
            } else {
                return dbService.addMember(member);
            }
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch only the members query
            queryClient.invalidateQueries({ queryKey: ['members'] });
            // If member has connections, also refetch connections
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            
            // Show success toast
            const existing = members.find(m => m.id === variables.id);
            if (existing) {
                toast.showSuccess('Member updated successfully');
                
                // Add update operation to history
                addOperation({
                    type: 'updateMember',
                    data: {
                        id: variables.id,
                        oldData: existing,
                        newData: variables
                    },
                    inverse: {
                        type: 'updateMember',
                        data: {
                            id: variables.id,
                            oldData: variables,
                            newData: existing
                        }
                    }
                });
            } else {
                toast.showSuccess('Member added successfully');
                
                // Add add operation to history
                addOperation({
                    type: 'addMember',
                    data: variables,
                    inverse: {
                        type: 'deleteMember',
                        data: { id: variables.id }
                    }
                });
            }
        },
        onError: () => {
            toast.showError('Failed to save member');
        },
    });

    const deleteMemberMutation = useMutation({
        mutationFn: (id: string) => {
            // Get the member data before deleting for undo operation
            const memberToDelete = members.find(m => m.id === id);
            if (memberToDelete) {
                // Store member data in a closure for use in onSuccess
                (deleteMemberMutation as any)._memberToDelete = memberToDelete;
            }
            return dbService.deleteMember(id);
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch both queries
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            
            // Show success toast
            toast.showSuccess('Member deleted successfully');
            
            // Add delete operation to history
            const memberToDelete = (deleteMemberMutation as any)._memberToDelete;
            if (memberToDelete) {
                addOperation({
                    type: 'deleteMember',
                    data: { id: variables, memberData: memberToDelete },
                    inverse: {
                        type: 'addMember',
                        data: memberToDelete
                    }
                });
                // Clear the stored member data
                (deleteMemberMutation as any)._memberToDelete = undefined;
            }
        },
        onError: () => {
            toast.showError('Failed to delete member');
            // Clear any stored member data on error
            (deleteMemberMutation as any)._memberToDelete = undefined;
        },
    });

    const handleSelectMember = (id: string) => {
        setSelectedMemberId(id);
    };

    const handleSaveMember = async (member: FamilyMember) => {
        await saveMemberMutation.mutateAsync(member);
        setIsMemberModalOpen(false);
        setEditingMember(null);
    };

    const handleDeleteMember = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this member? This will also remove connected lines.")) {
            await deleteMemberMutation.mutateAsync(id);
            if (selectedMemberId === id) setSelectedMemberId(null);
        }
    };

    const handleEditMemberRequest = (member: FamilyMember) => {
        setEditingMember(member);
        setIsMemberModalOpen(true);
    };

    const handleDataChange = () => {
        // Invalidate and refetch both queries
        queryClient.invalidateQueries({ queryKey: ['members'] });
        queryClient.invalidateQueries({ queryKey: ['connections'] });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-primary">
                <span className="material-symbols-outlined text-4xl animate-spin">autorenew</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full relative">
            <Navbar 
                currentView={currentView} 
                setView={setView} 
                showChinese={showChineseNames}
                setShowChinese={setShowChineseNames}
            />
            
            <main className="flex-1 relative flex flex-col h-full overflow-hidden">
                {currentView === 'tree' && (
                    <TreeView 
                        selectedId={selectedMemberId} 
                        onSelect={handleSelectMember} 
                        showChinese={showChineseNames}
                        members={members}
                        connections={connections}
                        onDataChange={handleDataChange}
                        onEditMember={handleEditMemberRequest}
                        isTimelineExpanded={isTimelineExpanded}
                    />
                )}
                
                {currentView === 'directory' && (
                    <DirectoryView 
                        onSelect={handleSelectMember} 
                        showChinese={showChineseNames}
                        members={members}
                    />
                )}

                {currentView === 'settings' && (
                    <SettingsView />
                )}
            </main>

            {/* Global Components */}
            {selectedMemberId && (
                <ProfileSidebar 
                    member={members.find(m => m.id === selectedMemberId) || null} 
                    onClose={() => setSelectedMemberId(null)}
                    onSelectMember={handleSelectMember}
                    showChinese={showChineseNames}
                    onEdit={() => {
                        const m = members.find(x => x.id === selectedMemberId);
                        if (m) handleEditMemberRequest(m);
                    }}
                    onDelete={() => handleDeleteMember(selectedMemberId)}
                    // Pass full data sets to sidebar for relationship calculation
                    members={members}
                    connections={connections}
                />
            )}

            {currentView === 'tree' && (
                <Timeline 
                    isExpanded={isTimelineExpanded}
                    onToggleExpanded={setIsTimelineExpanded}
                />
            )}

            {/* Modals placed at App level ensures they work from Sidebar OR Tree */}
            <EditMemberModal 
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                onSave={handleSaveMember}
                member={editingMember}
                lang={showChineseNames ? 'zh' : 'en'}
            />
        </div>
    );
};

export default App;
