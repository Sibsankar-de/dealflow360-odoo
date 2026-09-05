export type SelectOptionType = { key: string; value: string };

export type SelectType = {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  options?: SelectOptionType[];
  onChange?: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholderClass?: string;
  className?: string;
  dropdownClass?: string;
  /** When provided, renders a red error message below the select */
  errorMessage?: string;
  /** Option to add an icon on the left side */
  icon?: React.ReactNode;
  /** Optional label for the form field */
  label?: string;
};
