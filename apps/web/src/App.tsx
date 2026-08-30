import React, { useState, useEffect } from 'react';
import { useSynapseStore } from './store/synapseStore';
import { AppHeader } from './components/layout/AppHeader';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { ProjectsDirectoryScreen } from './components/projects/ProjectsDirectoryScreen';
import { SynapseCanvasView } from './components/canvas/SynapseCanvasView';
import { SynapseSectionsView } from './components/sections/SynapseSectionsView';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { NodeDetailDrawer } from './components/detail/NodeDetailDrawer';
import { CreateNodeModal } from './components/modals/CreateNodeModal';
import { CreateRelationModal } from './components/modals/CreateRelationModal';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { AuthModal } from './components/modals/AuthModal';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<
    'dashboard' | 'projects' | 'project-view' | 'search' | 'settings'
  >('project-view');

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  const viewMode = useSynapseStore((s) => s.viewMode);
  const setActiveProjectId = useSynapseStore((s) => s.setActiveProjectId);
  const initBackend = useSynapseStore((s) => s.initBackend);

  useEffect(() => {
    initBackend();
  }, [initBackend]);

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentScreen('project-view');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-text-main overflow-hidden font-sans">
      {/* Top Application Header */}
      <AppHeader
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onOpenProject={handleOpenProject}
            onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
          />
        )}

        {currentScreen === 'projects' && (
          <ProjectsDirectoryScreen
            onOpenProject={handleOpenProject}
            onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
          />
        )}

        {currentScreen === 'project-view' && (
          <div className="w-full h-full relative">
            {viewMode === 'canvas' ? <SynapseCanvasView /> : <SynapseSectionsView />}
          </div>
        )}

        {currentScreen === 'settings' && <SettingsScreen />}

        {/* Slide-over Node Detail Drawer */}
        <NodeDetailDrawer />
      </main>

      {/* Global Modals */}
      <CreateNodeModal />
      <CreateRelationModal />
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
      />
      <GlobalSearchModal />
      <AuthModal />
    </div>
  );
};

export default App;
