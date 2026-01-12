
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
    RefreshControl,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import teacherAPI from '../../services/api/teacher.api';
import { TeacherTask } from '../../types/teacher.types';
import { format } from 'date-fns';

const TeacherTasksScreen = () => {
    const navigation = useNavigation();
    const [tasks, setTasks] = useState<TeacherTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // New Task Form
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await teacherAPI.getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            Alert.alert('Error', 'Failed to load tasks');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTasks();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTasks();
    }, []);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) {
            Alert.alert('Required', 'Please enter a task title');
            return;
        }

        try {
            await teacherAPI.addTask({
                title: newTaskTitle,
                description: newTaskDescription,
                dueDate: new Date().toISOString() // Optional: add date picker later
            });
            setModalVisible(false);
            setNewTaskTitle('');
            setNewTaskDescription('');
            fetchTasks();
        } catch (error) {
            console.error('Failed to add task:', error);
            Alert.alert('Error', 'Failed to create task');
        }
    };

    const handleToggleTask = async (task: TeacherTask) => {
        try {
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            );
            setTasks(updatedTasks);

            await teacherAPI.updateTask(task.id, { isCompleted: !task.is_completed });
        } catch (error) {
            console.error('Failed to update task:', error);
            fetchTasks(); // Revert on error
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await teacherAPI.deleteTask(taskId);
                            fetchTasks();
                        } catch (error) {
                            console.error('Failed to delete task:', error);
                            Alert.alert('Error', 'Failed to delete task');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: TeacherTask }) => (
        <View style={styles.taskCard}>
            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleToggleTask(item)}
            >
                <View style={[styles.checkbox, item.is_completed && styles.checkedCheckbox]}>
                    {item.is_completed && <Feather name="check" size={16} color="#FFF" />}
                </View>
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, item.is_completed && styles.completedText]}>
                    {item.title}
                </Text>
                {item.description ? (
                    <Text style={styles.taskDesc}>{item.description}</Text>
                ) : null}
                <Text style={styles.taskDate}>
                    {item.created_at && !isNaN(new Date(item.created_at).getTime())
                        ? format(new Date(item.created_at), 'MMM dd, h:mm a')
                        : ''}
                </Text>
            </View>


        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Tasks</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <FlatList
                data={tasks}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b5998" />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Feather name="check-circle" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No tasks yet. Enjoy your day!</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Feather name="plus" size={24} color="#FFF" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Task</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Feather name="x" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="What needs to be done?"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            autoFocus
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add details (optional)"
                            value={newTaskDescription}
                            onChangeText={setNewTaskDescription}
                            multiline
                            numberOfLines={3}
                        />

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddTask}
                        >
                            <Text style={styles.addButtonText}>Create Task</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100, // Space for FAB
    },
    taskCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    checkboxContainer: {
        padding: 5,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#3b5998',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkedCheckbox: {
        backgroundColor: '#3b5998',
    },
    taskContent: {
        flex: 1,
        marginLeft: 12,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    taskDesc: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    taskDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 6,
    },
    deleteButton: {
        padding: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3b5998',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#888',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    addButton: {
        backgroundColor: '#3b5998',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TeacherTasksScreen;
