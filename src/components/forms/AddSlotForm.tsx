'use client'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

const schema = yup.object({
  date: yup.string().required('Date is required').test(
    'is-future',
    'Date must be in the future',
    (value) => new Date(value) > new Date()
  ),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  serviceType: yup.string().required('Service type is required'),
}).required()

type FormData = yup.InferType<typeof schema>

const serviceTypes = [
  { value: 'any', label: 'Any Service' },
  { value: 'haircut', label: 'Haircut Only' },
  { value: 'color', label: 'Color Service' },
  { value: 'styling', label: 'Styling Only' },
]

interface AddSlotFormProps {
  onSubmit: (data: Omit<FormData, 'date'> & { date: Date }) => void
  onCancel: () => void
  initialData?: Partial<Omit<FormData, 'date'> & { date: Date }>
}

export default function AddSlotForm({ onSubmit, onCancel, initialData }: AddSlotFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: initialData && initialData.date ? {
      ...initialData,
      date: initialData.date.toISOString().split('T')[0],
    } : undefined,
  })

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      date: new Date(data.date),
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Input
          type="date"
          label="Date"
          error={errors.date?.message}
          {...register('date')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            type="time"
            label="Start Time"
            error={errors.startTime?.message}
            {...register('startTime')}
          />
        </div>
        <div>
          <Input
            type="time"
            label="End Time"
            error={errors.endTime?.message}
            {...register('endTime')}
          />
        </div>
      </div>

      <div>
        <Select
          label="Service Type"
          options={serviceTypes}
          error={errors.serviceType?.message}
          {...register('serviceType')}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          {initialData ? 'Update Slot' : 'Add Slot'}
        </Button>
      </div>
    </form>
  )
} 