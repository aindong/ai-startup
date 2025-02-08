import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task } from '../services/task.service';
import { useAgents } from '../hooks/useAgents';
import { useCreateTask, useUpdateTask } from '../hooks/useTasks';
import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';

// Helper functions for metadata handling
type MetadataValue = string | number | boolean | null;
type NestedMetadataValue = MetadataValue | Record<string, MetadataValue>;
type FlatMetadataItem = {
  key: string;
  value: MetadataValue;
  parentKey?: string | null;
};

function stringifyNestedValue(value: unknown): MetadataValue {
  if (typeof value === 'object' && value !== null) {
    return null;
  }
  return value as MetadataValue;
}

function flattenMetadata(obj: Record<string, unknown>): FlatMetadataItem[] {
  const result: FlatMetadataItem[] = [];

  function traverse(current: Record<string, unknown>, parentKey?: string) {
    for (const [key, value] of Object.entries(current)) {
      if (typeof value === 'object' && value !== null) {
        result.push({ key, value: null, parentKey });
        traverse(value as Record<string, unknown>, key);
      } else {
        result.push({
          key,
          value: stringifyNestedValue(value),
          parentKey,
        });
      }
    }
  }

  traverse(obj);
  return result;
}

function unflattenMetadata(items: FlatMetadataItem[]): Record<string, NestedMetadataValue> {
  const result: Record<string, NestedMetadataValue> = {};

  // First pass: create parent objects
  items.forEach(item => {
    if (!item.parentKey) {
      result[item.key] = item.value;
    }
  });

  // Second pass: handle nested items
  items.forEach(item => {
    if (item.parentKey && item.parentKey in result) {
      const parent = result[item.parentKey];
      if (typeof parent === 'object' && parent !== null) {
        (parent as Record<string, MetadataValue>)[item.key] = item.value;
      } else {
        result[item.parentKey] = { [item.key]: item.value };
      }
    }
  });

  return result;
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  assignedTo: z.string().nullable(),
  metadata: z.array(z.object({
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    parentKey: z.string().nullable().optional(),
  })),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
  onSuccess?: (task: Task) => void;
}

export function TaskForm({ task, onClose, onSuccess }: TaskFormProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'MEDIUM',
      status: task?.status ?? 'TODO',
      assignedTo: task?.assignedTo?.id ?? null,
      metadata: task?.metadata ? flattenMetadata(task.metadata) : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'metadata',
  });

  const { data: agents = [], isLoading: isLoadingAgents } = useAgents();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const watchAssignedTo = watch('assignedTo');

  useEffect(() => {
    if (task?.assignedTo?.id && agents.length > 0) {
      setValue('assignedTo', task.assignedTo.id);
    }
  }, [task?.assignedTo?.id, agents, setValue]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      const assignedTo = data.assignedTo || null;
      const validMetadata = data.metadata
        .filter(item => String(item.key).trim() !== '')
        .map(item => ({
          ...item,
          key: String(item.key).trim(),
          value: item.value === '' ? null : item.value,
          parentKey: item.parentKey ? String(item.parentKey) : null
        }));

      const metadata = validMetadata.length > 0 
        ? unflattenMetadata(validMetadata)
        : {};
      
      let result: Task;
      
      if (task) {
        result = await updateTask.mutateAsync({
          taskId: task.id,
          data: {
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status,
            assignedTo,
            metadata,
          },
        });
      } else {
        result = await createTask.mutateAsync({
          title: data.title,
          description: data.description,
          priority: data.priority,
          assignedTo,
          metadata,
        });
      }

      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const modalFooter = (
    <>
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="taskForm"
        disabled={isSubmitting || isLoadingAgents}
        isLoading={isSubmitting}
      >
        Save
      </Button>
    </>
  );

  const modalTitle = (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-white">
        {task ? 'Edit Task' : 'Create Task'}
      </h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMetadata(!showMetadata)}
        className="lg:hidden"
      >
        {showMetadata ? 'Hide Metadata ↑' : 'Show Metadata ↓'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={modalTitle}
      footer={modalFooter}
      isClosing={isClosing}
      size="lg"
    >
      <form id="taskForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(90vh-12rem)]">
        {/* Core Task Fields */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-2 space-y-6 -mx-2">
            <div className="space-y-4">
              <Input
                label="Title"
                placeholder="Enter task title"
                error={errors.title?.message}
                {...register('title')}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="w-full bg-slate-800/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                    transition-colors duration-200 min-h-[120px] resize-none"
                  placeholder="Enter task description"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-400">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Priority"
                  error={errors.priority?.message}
                  {...register('priority')}
                  options={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                  ]}
                />

                <Select
                  label="Assign To"
                  error={errors.assignedTo?.message}
                  {...register('assignedTo')}
                  disabled={isLoadingAgents}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...agents.map(agent => ({
                      value: agent.id,
                      label: `${agent.name} (${agent.role})`
                    }))
                  ]}
                />
              </div>

              {task && (
                <div className="space-y-2">
                  <Select
                    label="Status"
                    error={errors.status?.message}
                    {...register('status')}
                    disabled={!watchAssignedTo}
                    options={[
                      { value: 'TODO', label: 'Todo' },
                      { value: 'IN_PROGRESS', label: 'In Progress' },
                      { value: 'REVIEW', label: 'Review' },
                      { value: 'DONE', label: 'Done' },
                    ]}
                  />
                  {!watchAssignedTo && (
                    <p className="text-sm text-yellow-400">
                      Task must be assigned to change status
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Fields */}
        <div 
          id="metadata-section"
          className={`flex-1 overflow-hidden transition-all duration-200 
            ${showMetadata ? 'max-h-full opacity-100' : 'lg:max-h-full lg:opacity-100 max-h-0 opacity-0'}`}
        >
          <div className="h-full overflow-y-auto px-2 -mx-2">
            <div className="sticky top-0 bg-slate-900 pb-4 mb-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">
                  Metadata Fields
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => append({ key: '', value: '' })}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                      transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Field
                  </button>
                  <button
                    type="button"
                    onClick={() => append({ key: 'parent', value: null })}
                    className="px-3 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-600 
                      transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Parent
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => {
                const isParent = field.value === null;
                const isChild = field.parentKey != null;
                
                // Skip child fields as they'll be rendered with their parent
                if (isChild) return null;
                
                // Find all child fields for this parent
                const childFields = isParent ? fields.filter(f => f.parentKey === field.key) : [];
                
                return (
                  <div key={field.id} className="space-y-2">
                    {/* Parent/Regular Field */}
                    <div className={`group flex items-center gap-3 rounded-lg p-2 -mx-2
                      hover:bg-slate-800/50 transition-colors duration-200
                      ${isParent ? 'bg-slate-800/30' : ''}`}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        {isParent ? (
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-lg">▼</span>
                            <input
                              {...register(`metadata.${index}.key`)}
                              placeholder="Parent Name"
                              className="flex-1 min-w-[120px] bg-transparent rounded-lg px-3 py-2 text-white placeholder-slate-400 
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800/50
                                transition-colors duration-200 font-medium"
                            />
                          </div>
                        ) : (
                          <input
                            {...register(`metadata.${index}.key`)}
                            placeholder="Key"
                            className="flex-1 min-w-[120px] bg-slate-800/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                              transition-colors duration-200"
                          />
                        )}
                      </div>
                      
                      {!isParent && (
                        <input
                          {...register(`metadata.${index}.value`)}
                          placeholder="Value"
                          className="flex-1 min-w-[120px] bg-slate-800/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                            transition-colors duration-200"
                          onChange={(e) => {
                            const value = e.target.value;
                            const field = register(`metadata.${index}.value`);
                            
                            if (value === 'true') field.onChange({ target: { value: true } });
                            else if (value === 'false') field.onChange({ target: { value: false } });
                            else if (!isNaN(Number(value)) && value !== '') field.onChange({ target: { value: Number(value) } });
                            else field.onChange(e);
                          }}
                        />
                      )}

                      <div className="flex gap-1">
                        {!isParent && (
                          <button
                            type="button"
                            onClick={() => {
                              const newParentKey = field.key;
                              remove(index);
                              append({ key: newParentKey, value: null });
                            }}
                            className="shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center
                              bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white 
                              transition-all duration-200"
                            aria-label="Convert to parent"
                            title="Convert to parent"
                          >
                            ⤵
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center
                            bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600 hover:text-white 
                            transition-all duration-200"
                          aria-label="Remove field"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Child Fields */}
                    {isParent && (
                      <div className="pl-6 space-y-2 border-l-2 border-slate-700">
                        {childFields.map((childField) => {
                          const actualIndex = fields.findIndex(f => f.id === childField.id);
                          
                          return (
                            <div key={childField.id} 
                              className="group flex items-center gap-3 rounded-lg p-2 -mx-2
                                hover:bg-slate-800/50 transition-colors duration-200"
                            >
                              <div className="flex-1 min-w-0 flex items-center gap-3">
                                <span className="text-slate-500">→</span>
                                <input
                                  {...register(`metadata.${actualIndex}.key`)}
                                  placeholder="Key"
                                  className="flex-1 min-w-[120px] bg-slate-800/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                                    transition-colors duration-200"
                                />
                              </div>
                              <input
                                {...register(`metadata.${actualIndex}.value`)}
                                placeholder="Value"
                                className="flex-1 min-w-[120px] bg-slate-800/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                                  transition-colors duration-200"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const field = register(`metadata.${actualIndex}.value`);
                                  
                                  if (value === 'true') field.onChange({ target: { value: true } });
                                  else if (value === 'false') field.onChange({ target: { value: false } });
                                  else if (!isNaN(Number(value)) && value !== '') field.onChange({ target: { value: Number(value) } });
                                  else field.onChange(e);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => remove(actualIndex)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center
                                  bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600 hover:text-white 
                                  transition-all duration-200"
                                aria-label="Remove field"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                                
                        {/* Add Child Button */}
                        <button
                          type="button"
                          onClick={() => append({ key: '', value: '', parentKey: field.key })}
                          className="w-full group flex items-center gap-2 rounded-lg p-2 -mx-2
                            text-slate-400 hover:text-slate-300 transition-colors duration-200"
                        >
                          <span className="text-slate-500">→</span>
                          <span className="text-sm">Add Child Field</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {fields.length === 0 && (
                <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-slate-700">
                  <p className="text-slate-400 mb-2">No metadata fields added yet</p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => append({ key: '', value: '' })}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Add a field
                    </button>
                    <span className="text-slate-600">or</span>
                    <button
                      type="button"
                      onClick={() => append({ key: 'parent', value: null })}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Add a parent
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
} 