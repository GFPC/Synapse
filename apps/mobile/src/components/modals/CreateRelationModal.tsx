import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { RelationType } from '../../types';
import { THEME, RELATION_CONFIG, RelationConfig } from '../../theme/tokens';
import { useSynapseMobileStore } from '../../store/synapseMobileStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const CreateRelationModal: React.FC<Props> = ({ visible, onClose }) => {
  const {
    nodes,
    relationSourceNode,
    createRelation,
  } = useSynapseMobileStore();

  const [selectedType, setSelectedType] = useState<RelationType>('depends_on');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTargets = nodes.filter(
    (n) => n.id !== relationSourceNode?.id
  );

  const handleSubmit = async () => {
    if (!relationSourceNode || !selectedTargetId) return;
    setIsSubmitting(true);
    await createRelation(relationSourceNode.id, selectedTargetId, selectedType, note.trim());
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>CREATE GRAPH RELATION</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Source Node Info */}
            <View style={styles.sourceBox}>
              <Text style={styles.label}>SOURCE NODE</Text>
              <Text style={styles.sourceTitle}>
                [{relationSourceNode?.display_id}] {relationSourceNode?.title}
              </Text>
            </View>

            {/* Relation Type Picker */}
            <View style={styles.field}>
              <Text style={styles.label}>RELATION TYPE</Text>
              <View style={styles.relTypesWrap}>
                {(Object.keys(RELATION_CONFIG) as RelationType[]).map((rType) => {
                  const conf: RelationConfig = RELATION_CONFIG[rType];
                  const isSelected = selectedType === rType;

                  return (
                    <TouchableOpacity
                      key={rType}
                      style={[
                        styles.relTypeChip,
                        { borderColor: conf.color },
                        isSelected && { backgroundColor: `${conf.color}30` },
                      ]}
                      onPress={() => setSelectedType(rType)}
                    >
                      <Text style={[styles.relTypeText, { color: conf.color }]}>
                        {conf.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Target Node Picker */}
            <View style={styles.field}>
              <Text style={styles.label}>TARGET NODE</Text>
              <ScrollView style={styles.targetList} nestedScrollEnabled>
                {availableTargets.map((target) => {
                  const isSelected = selectedTargetId === target.id;

                  return (
                    <TouchableOpacity
                      key={target.id}
                      style={[
                        styles.targetItem,
                        isSelected && styles.targetItemActive,
                      ]}
                      onPress={() => setSelectedTargetId(target.id)}
                    >
                      <Text style={styles.targetDisplayId}>
                        [{target.display_id}]
                      </Text>
                      <Text style={styles.targetTitle} numberOfLines={1}>
                        {target.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Optional Note */}
            <View style={styles.field}>
              <Text style={styles.label}>NOTE / CONTEXT (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Reason or technical context for this link..."
                placeholderTextColor={THEME.text4}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!selectedTargetId || isSubmitting) && { opacity: 0.5 },
              ]}
              disabled={!selectedTargetId || isSubmitting}
              onPress={handleSubmit}
            >
              <Text style={styles.submitBtnText}>Create Relation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: THEME.surface1,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.border2,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.text4,
  },
  closeText: {
    fontSize: 13,
    color: THEME.text3,
  },
  body: {
    padding: 14,
  },
  sourceBox: {
    backgroundColor: THEME.surface2,
    padding: 10,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 12,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: THEME.text4,
    marginBottom: 6,
  },
  sourceTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.text1,
  },
  field: {
    marginBottom: 12,
  },
  relTypesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  relTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  relTypeText: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '700',
  },
  targetList: {
    maxHeight: 140,
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 9,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  targetItemActive: {
    backgroundColor: THEME.accentDim,
  },
  targetDisplayId: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: THEME.accentBright,
    fontWeight: '700',
  },
  targetTitle: {
    fontSize: 12,
    color: THEME.text1,
    flex: 1,
  },
  input: {
    backgroundColor: THEME.surface2,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: THEME.text1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: THEME.surface3,
  },
  cancelBtnText: {
    fontSize: 11.5,
    color: THEME.text3,
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: THEME.accent,
  },
  submitBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#000',
  },
});
