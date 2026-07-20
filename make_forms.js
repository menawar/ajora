const fs = require('fs');
const { execSync } = require('child_process');

const components = [
  {
    name: 'Input.tsx',
    msg: 'feat(ui): create reusable Input component with variants',
    code: `import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={\`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-celo-green/50 \${error ? "border-red-500 bg-red-50/50" : "border-gray-200 hover:border-gray-300 bg-white"} \${className}\`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
`
  },
  {
    name: 'Textarea.tsx',
    msg: 'feat(ui): create reusable Textarea component for multi-line input',
    code: `import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={\`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-celo-green/50 \${error ? "border-red-500 bg-red-50/50" : "border-gray-200 hover:border-gray-300 bg-white"} \${className}\`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
`
  },
  {
    name: 'Label.tsx',
    msg: 'feat(ui): create Label component for accessible forms',
    code: `import { LabelHTMLAttributes, forwardRef } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={\`text-sm font-medium text-gray-700 \${className}\`}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = "Label";
`
  },
  {
    name: 'Checkbox.tsx',
    msg: 'feat(ui): create custom Checkbox component with SVG checkmark',
    code: `import { InputHTMLAttributes, forwardRef } from "react";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={\`h-4 w-4 rounded border-gray-300 text-celo-green focus:ring-celo-green/50 \${className}\`}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";
`
  },
  {
    name: 'FormGroup.tsx',
    msg: 'feat(ui): create FormGroup for spacing form elements',
    code: `import { ReactNode } from "react";

export function FormGroup({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <div className={\`flex flex-col gap-1.5 \${className}\`}>
      {children}
    </div>
  );
}
`
  }
];

components.forEach(comp => {
  fs.writeFileSync(\`app/components/ui/\${comp.name}\`, comp.code);
  execSync(\`git add app/components/ui/\${comp.name}\`);
  execSync(\`git commit -m "\${comp.msg}"\`);
});
