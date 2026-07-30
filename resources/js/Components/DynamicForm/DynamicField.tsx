import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField } from '@/types';
import FieldRenderer from '@/Components/FormBuilder/FieldRenderer';

interface DynamicFieldProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (fieldId: number, value: any) => void;
  errors?: Record<string, string>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, height: 0 },
  show: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

export default function DynamicField({ fields, values, onChange, errors }: DynamicFieldProps) {
  const visibleFields = fields.filter(field => {
    if (!field.parent_field_id) return true;
    const parentValue = values[field.parent_field_id];
    return parentValue === field.trigger_value;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <AnimatePresence initial={false}>
        {visibleFields.map(field => (
          <motion.div
            key={field.id}
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            layout
          >
            <FieldRenderer
              field={field}
              value={values[field.id]}
              onChange={onChange}
              errors={errors}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
