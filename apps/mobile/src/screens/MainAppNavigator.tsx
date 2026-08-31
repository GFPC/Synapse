import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { HeaderBar } from '../components/ui/HeaderBar';
import { BottomTabBar } from '../components/navigation/BottomTabBar';
import { ArchitectureSectionsScreen } from './ArchitectureSectionsScreen';
import { QuickDropScreen } from './QuickDropScreen';
import { IdeasScreen } from './IdeasScreen';
import { SettingsScreen } from './SettingsScreen';
import { AccountScreen } from './AccountScreen';
import { NodeDetailModal } from '../components/drawer/NodeDetailModal';
import { CreateNodeModal } from '../components/modals/CreateNodeModal';
import { CreateRelationModal } from '../components/modals/CreateRelationModal';
import { THEME } from '../theme/tokens';
import { Project } from '../types';

export const MainAppNavigator: React.FC = () => {
  const {
    currentTab,
    switchTab,
    init,
    nodes,
    projects,
    activeProject,
    selectProject,
    selectedNodeId,
    selectNode,
    currentUser,
    isConnected,
    serverStatus,
    isCreateNodeModalOpen,
    openCreateNodeModal,
    closeCreateNodeModal,
    isCreateRelationModalOpen,
    closeCreateRelationModal,
  } = useSynapseMobileStore();

  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090D12" />

      {/* 1. Header Bar */}
      <HeaderBar
        activeProject={activeProject}
        isConnected={isConnected}
        serverStatus={serverStatus}
        currentUser={currentUser}
        onOpenProjectPicker={() => setIsProjectPickerOpen(true)}
        onOpenCreateNode={openCreateNodeModal}
        onOpenAccount={() => switchTab(currentTab === 'account' ? 'nodes' : 'account')}
      />

      {/* 2. Main Screen View */}
      <View style={styles.screenContainer}>
        {(currentTab === 'nodes' || currentTab === 'sections' || currentTab === 'tree' || currentTab === 'metrics') && (
          <ArchitectureSectionsScreen />
        )}
        {currentTab === 'quickdrop' && <QuickDropScreen />}
        {currentTab === 'ideas' && <IdeasScreen />}
        {currentTab === 'settings' && <SettingsScreen />}
        {currentTab === 'account' && <AccountScreen />}
      </View>

      {/* 3. Bottom Tab Bar (4 clean tabs) */}
      <BottomTabBar
        currentTab={currentTab}
        onSelectTab={switchTab}
        nodesCount={nodes.length}
      />

      {/* 4. Global Modals */}
      <NodeDetailModal
        node={selectedNode}
        visible={selectedNode !== null}
        onClose={() => selectNode(null)}
      />

      <CreateNodeModal
        visible={isCreateNodeModalOpen}
        onClose={closeCreateNodeModal}
      />

      <CreateRelationModal
        visible={isCreateRelationModalOpen}
        onClose={closeCreateRelationModal}
      />

      {/* Project Switcher Modal */}
      <Modal
        visible={isProjectPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProjectPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsProjectPickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>SELECT PROJECT</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {projects.map((p: Project) => {
                const isSelected = activeProject?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.projectItem, isSelected && styles.projectItemActive]}
                    onPress={() => {
                      selectProject(p.id);
                      setIsProjectPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.projectItemName, isSelected && styles.projectItemNameActive]}>
                      {p.name}
                    </Text>
                    {isSelected && <Text style={styles.checkIcon}>?</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D12',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#090D12',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    backgroundColor: '#121820',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#212A36',
    width: '100%',
    maxWidth: 360,
    padding: 16,
  },
  pickerTitle: {
    color: '#8A8A94',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  projectItemActive: {
    backgroundColor: '#1E2633',
  },
  projectItemName: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '500',
  },
  projectItemNameActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  checkIcon: {
    color: '#6366F1',
    fontWeight: '700',
  },
});
