export type ValidationSeverity = "error" | "warning";

export type ContractValidationStatus = "valid" | "invalid";

export type ValidationIssue = {
  field: string;
  severity: ValidationSeverity;
  message: string;
};

export type ValidationResult = {
  status: ContractValidationStatus;
  issues: ValidationIssue[];
};
