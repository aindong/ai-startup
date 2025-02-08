import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task } from '../services/task.service';
import { useAgents } from '../hooks/useAgents';
import { useCreateTask, useUpdateTask } from '../hooks/useTasks';
import { useState } from 'react';

// Helper functions for metadata handling
type MetadataValue = string | number | boolean | null;
type NestedMetadataValue = MetadataValue | Record<string, MetadataValue>;
type FlatMetadataItem = { key: string; value: MetadataValue };

function stringifyNestedValue(value: unknown): MetadataValue {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return value as MetadataValue;
}

function flattenMetadata(obj: Record<string, unknown>, parentKey = ''): FlatMetadataItem[] {
  return Object.entries(obj).reduce<FlatMetadataItem[]>((acc, [key, value]) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      return [...acc, ...flattenMetadata(value as Record<string, unknown>, newKey)];
    }
    
    return [...acc, { key: newKey, value: stringifyNestedValue(value) }];
  }, []);
}

function unflattenMetadata(items: FlatMetadataItem[]): Record<string, NestedMetadataValue> {
  return items.reduce<Record<string, NestedMetadataValue>>((acc, { key, value }) => {
    const keys = key.split('.');
    let current = acc;
    
    keys.slice(0, -1).forEach((k) => {
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k] as Record<string, NestedMetadataValue>;
    });
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    
    return acc;
  }, {});
}

const metadataItemSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  assignedTo: z.string().nullable().optional(),
  metadata: z.array(metadataItemSchema).default([]).transform((items) => {
    // Transform the flat metadata array into a nested object during validation
    return unflattenMetadata(items);
  }),
});

type TaskFormData = Omit<z.infer<typeof taskSchema>, 'metadata'> & {
  metadata: FlatMetadataItem[];
};

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
    setTimeout(onClose, 200); // Match the duration of the fade-out transition
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
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

  const onSubmit = async (data: TaskFormData) => {
    try {
      // Convert metadata array to nested object
      const metadata = unflattenMetadata(data.metadata);

      // Convert empty string to null for assignedTo
      const assignedTo = data.assignedTo || null;

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

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 
        transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClose}
      role="dialog"
      aria-labelledby="task-form-title"
      aria-modal="true"
    >
      <div 
        className={`bg-slate-900 rounded-xl shadow-xl ring-1 ring-white/10 w-full max-h-[90vh] overflow-hidden
          sm:max-w-[640px] lg:max-w-[940px] xl:max-w-[1024px] 
          transform transition-all duration-200
          ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="task-form-title" className="text-xl font-bold text-white">
              {task ? 'Edit Task' : 'Create Task'}
            </h2>
            <div className="flex items-center gap-3">
              {/* Mobile metadata toggle */}
              <button
                type="button"
                onClick={() => setShowMetadata(!showMetadata)}
                className="lg:hidden px-3 py-2 text-sm font-medium bg-slate-800 text-slate-300 
                  rounded-lg hover:bg-slate-700 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={showMetadata}
                aria-controls="metadata-section"
              >
                {showMetadata ? (
                  <>
                    <span className="sr-only">Hide Metadata</span>
                    <span aria-hidden="true">Hide Metadata ↑</span>
                  </>
                ) : (
                  <>
                    <span className="sr-only">Show Metadata</span>
                    <span aria-hidden="true">Show Metadata ↓</span>
                  </>
                )}
              </button>
              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-slate-400 hover:text-white 
                  hover:bg-slate-800 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close form"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form id="taskForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(90vh-12rem)] overflow-hidden">
            {/* Core Task Fields */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    className="w-full bg-slate-800/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                      transition-colors duration-200"
                    placeholder="Enter task title"
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    className="w-full bg-slate-800/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                      transition-colors duration-200 min-h-[120px] resize-none"
                    placeholder="Enter task description"
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-400">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-2">
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full bg-slate-800/50 rounded-lg px-4 py-3 text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                        transition-colors duration-200"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                    {errors.priority && (
                      <p className="mt-2 text-sm text-red-400">{errors.priority.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-slate-300 mb-2">
                      Assign To
                    </label>
                    <select
                      {...register('assignedTo')}
                      className="w-full bg-slate-800/50 rounded-lg px-4 py-3 text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                        transition-colors duration-200"
                      disabled={isLoadingAgents}
                    >
                      <option value="">Unassigned</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.role})
                        </option>
                      ))}
                    </select>
                    {errors.assignedTo && (
                      <p className="mt-2 text-sm text-red-400">{errors.assignedTo.message}</p>
                    )}
                  </div>
                </div>

                {task && (
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full bg-slate-800/50 rounded-lg px-4 py-3 text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                        transition-colors duration-200"
                      disabled={!watchAssignedTo}
                    >
                      <option value="TODO">Todo</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="DONE">Done</option>
                    </select>
                    {!watchAssignedTo && (
                      <p className="mt-2 text-sm text-yellow-400">
                        Task must be assigned to change status
                      </p>
                    )}
                    {errors.status && (
                      <p className="mt-2 text-sm text-red-400">{errors.status.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Fields */}
            <div 
              id="metadata-section"
              className={`flex-1 overflow-hidden transition-all duration-200 
                ${showMetadata ? 'max-h-full opacity-100' : 'lg:max-h-full lg:opacity-100 max-h-0 opacity-0'}`}
            >
              <div className="h-full overflow-y-auto pr-2">
                <div className="sticky top-0 bg-slate-900 pb-4 mb-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-300">
                      Metadata Fields
                    </label>
                    <button
                      type="button"
                      onClick={() => append({ key: '', value: '' })}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Add Field
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const isNested = field.key.includes('.');
                    return (
                      <div key={field.id} 
                        className={`group flex gap-3 rounded-lg p-2 -mx-2
                          ${isNested ? 'ml-6 border-l-2 border-slate-700' : ''} 
                          hover:bg-slate-800/50 transition-colors duration-200`}
                      >
                        <input
                          {...register(`metadata.${index}.key`)}
                          placeholder="Key"
                          className="flex-1 bg-slate-800/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 
                            transition-colors duration-200"
                        />
                        <input
                          {...register(`metadata.${index}.value`)}
                          placeholder="Value"
                          className="flex-1 bg-slate-800/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 
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
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="opacity-0 group-hover:opacity-100 px-3 py-2 bg-red-600/10 text-red-400 
                            rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  {fields.length === 0 && (
                    <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-slate-700">
                      <p className="text-slate-400 mb-2">No metadata fields added yet</p>
                      <button
                        type="button"
                        onClick={() => append({ key: '', value: '' })}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Add your first metadata field
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-800/50 border-t border-white/5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white 
              hover:bg-slate-800 rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="taskForm"
            disabled={isSubmitting || isLoadingAgents}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg 
              hover:bg-blue-700 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500
              flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 