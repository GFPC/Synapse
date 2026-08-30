import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { HeaderBar } from '../components/ui/HeaderBar';
import { BottomTabBar } from '../components/navigation/BottomTabBar';
import { ArchitectureSectionsScreen } from './ArchitectureSectionsScreen';
import { RelationsTreeScreen } from './RelationsTreeScreen';
import { MetricsAdrScreen } from './MetricsAdrScreen';
import { GlobalSearchScreen } from './GlobalSearchScreen';
import { ProjectsScreen } from './ProjectsScreen';
import { NodeDetailModal } from '../components/drawer/NodeDetailModal';
import { CreateNodeModal } from '../components/modals/CreateNodeModal';
import { CreateRelationModal } from '../components/modals/CreateRelationModal';
import { THEME } from '../theme/tokens';

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
      <StatusBar barStyle="light-content" backgroundColor={THEME.surface1} />

      {/* Persistent App Header */}
      <HeaderBar
        activeProject={activeProject}
        isConnected={isConnected}
        serverStatus={serverStatus}
        onOpenProjectPicker={() => setIsProjectPickerOpen(true)}
        onOpenCreateNode={openCreateNodeModal}
      />

      {/* Active Screen Tab View */}
      <View style={styles.screenContainer}>
        {currentTab === 'sections' && <ArchitectureSectionsScreen />}
        {currentTab === 'tree' && <RelationsTreeScreen />}
        {currentTab === 'metrics' && <MetricsAdrScreen />}
        {currentTab === 'search' && <GlobalSearchScreen />}
        {currentTab === 'projects' && <ProjectsScreen />}
      </View>

      {/* Bottom Tab Bar Navigation */}
      <BottomTabBar
        currentTab={currentTab}
        onSelectTab={switchTab}
        nodesCount={nodes.length}
      />

      {/* Global Node Inspector Modal */}
      <NodeDetailModal
        node={selectedNode}
        visible={selectedNode !== null}
        onClose={() => selectNode(null)}
      />

      {/* Global Create Node Modal */}
      <CreateNodeModal
        visible={isCreateNodeModalOpen}
        onClose={closeCreateNodeModal}
      />

      {/* Global Create Relation Modal */}
      <CreateRelationModal
        visible={isCreateRelationModalOpen}
        onClose={closeCreateRelationModal}
      />

      {/* Quick Project Picker Modal */}
      <Modal
        visible={isProjectPickerOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsProjectPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsProjectPickerOpen(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>ВЫБОР АРХИТЕКТУРНОЙ СХЕМЫ</Text>
            {projects.map((proj) => {
              const isCurrent = activeProject?.id === proj.id;
              return (
                <TouchableOpacity
                  key={proj.id}
                  style={[
                    styles.pickerItem,
                    isCurrent && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    selectProject(proj.id);
                    setIsProjectPickerOpen(false);
                  }}
                >
                  <View style={styles.pickerItemHead}>
                    <Text style={styles.pickerItemIcon}>📁</Text>
                    <Text style={styles.pickerItemName} numberOfLines={1}>
                      {proj.name}
                    </Text>
                  </View>
                  {proj.description ? (
                    <Text style={styles.pickerItemDesc} numberOfLines={2}>
                      {proj.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  screenContainer: {
    flex: 1,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerModal: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    padding: 16,
    gap: 10,
  },
  pickerTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: THEME.text4,
    marginBottom: 4,
  },
  pickerItem: {
    backgroundColor: THEME.surface2,
    padding: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  pickerItemActive: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentDim,
  },
  pickerItemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pickerItemIcon: {
    fontSize: 14,
  },
  pickerItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
    flex: 1,
  },
  pickerItemDesc: {
    fontSize: 11,
    color: THEME.text3,
    lineHeight: 15,
  },
});
