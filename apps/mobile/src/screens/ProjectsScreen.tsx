import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useSynapseMobileStore } from '../store/synapseMobileStore';
import { THEME } from '../theme/tokens';
import { Project } from '../types';

export const ProjectsScreen: React.FC = () => {
  const {
    projects,
    activeProject,
    selectProject,
    createProject,
    currentUser,
    serverStatus,
    serverLatencyMs,
    isConnected,
    checkServerHealth,
  } = useSynapseMobileStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const handleCreate = async () => {
    if (!newProjName.trim()) return;
    await createProject(newProjName.trim(), newProjDesc.trim());
    setNewProjName('');
    setNewProjDesc('');
    setIsCreateModalOpen(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* SECTION 1: Current Project Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>ARCHITECTURE SCHEMAS & PROJECTS</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsCreateModalOpen(true)}
          >
            <Text style={styles.addBtnText}>＋ New Project</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.projectsList}>
          {projects.map((proj: Project) => {
            const isActive = activeProject?.id === proj.id;

            return (
              <TouchableOpacity
                key={proj.id}
                style={[styles.projItem, isActive && styles.projItemActive]}
                activeOpacity={0.75}
                onPress={() => selectProject(proj.id)}
              >
                <View style={styles.projTopRow}>
                  <View style={styles.projIconBox}>
                    <Text style={styles.projIcon}>📁</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projName} numberOfLines={1}>
                      {proj.name}
                    </Text>
                    {isActive && (
                      <View style={styles.activePill}>
                        <Text style={styles.activePillText}>ACTIVE SCHEMA</Text>
                      </View>
                    )}
                  </View>
                </View>

                {proj.description ? (
                  <Text style={styles.projDesc} numberOfLines={2}>
                    {proj.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SECTION 2: Production Server Telemetry */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>PRODUCTION SERVER TELEMETRY</Text>
          <TouchableOpacity onPress={checkServerHealth}>
            <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.telemetryGrid}>
          <View style={styles.telemItem}>
            <Text style={styles.telemLabel}>PRODUCTION REST API</Text>
            <Text style={styles.telemValue}>http://87.58.204.138</Text>
          </View>

          <View style={styles.telemItem}>
            <Text style={styles.telemLabel}>HEALTH STATUS</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: serverStatus === 'online' ? THEME.status.ok : THEME.status.crit },
                ]}
              />
              <Text
                style={[
                  styles.telemValue,
                  { color: serverStatus === 'online' ? THEME.status.ok : THEME.status.crit },
                ]}
              >
                {serverStatus === 'online' ? '200 OK (Healthy)' : 'Offline / Unreachable'}
              </Text>
            </View>
          </View>

          <View style={styles.telemItem}>
            <Text style={styles.telemLabel}>NETWORK ROUNDTRIP PING</Text>
            <Text style={styles.telemValue}>{serverLatencyMs} ms</Text>
          </View>

          <View style={styles.telemItem}>
            <Text style={styles.telemLabel}>WEBSOCKET LIVE MESH</Text>
            <Text style={[styles.telemValue, { color: isConnected ? '#86EFAC' : '#FCD34D' }]}>
              {isConnected ? 'ws://87.58.204.138/ws' : 'Disconnected'}
            </Text>
          </View>

          <View style={styles.telemItem}>
            <Text style={styles.telemLabel}>DATABASE ENGINE</Text>
            <Text style={styles.telemValue}>PostgreSQL 16 tsvector FTS</Text>
          </View>
        </View>
      </View>

      {/* Create Project Modal */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CREATE ARCHITECTURE PROJECT</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Project Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Distributed Edge Ledger Pipeline"
                placeholderTextColor={THEME.text4}
                value={newProjName}
                onChangeText={setNewProjName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Architecture Scope & Description</Text>
              <TextInput
                style={[styles.fieldInput, { height: 70 }]}
                placeholder="High-level architectural intent and goals..."
                placeholderTextColor={THEME.text4}
                multiline
                value={newProjDesc}
                onChangeText={setNewProjDesc}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate}>
                <Text style={styles.confirmBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  cardTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: THEME.text4,
    letterSpacing: 0.5,
  },
  addBtn: {
    backgroundColor: THEME.surface3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  addBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.accentBright,
  },
  refreshBtnText: {
    fontSize: 10.5,
    color: THEME.accentBright,
    fontWeight: '600',
  },
  projectsList: {
    gap: 8,
  },
  projItem: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
  },
  projItemActive: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accentDim,
  },
  projTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  projIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: THEME.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projIcon: {
    fontSize: 14,
  },
  projName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text1,
  },
  activePill: {
    backgroundColor: THEME.accent,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  activePillText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#000',
  },
  projDesc: {
    fontSize: 11,
    color: THEME.text3,
    lineHeight: 15,
  },
  telemetryGrid: {
    gap: 10,
  },
  telemItem: {
    backgroundColor: THEME.surface2,
    padding: 10,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  telemLabel: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '700',
    color: THEME.text4,
    marginBottom: 3,
  },
  telemValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: THEME.text1,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: THEME.text4,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: THEME.text2,
  },
  fieldInput: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: THEME.text1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: THEME.surface3,
  },
  cancelBtnText: {
    fontSize: 12,
    color: THEME.text3,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: THEME.accent,
  },
  confirmBtnText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '700',
  },
});
