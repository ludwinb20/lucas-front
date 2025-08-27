import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Limpia completamente un input de archivo para permitir que se pueda volver a usar
 * con el mismo archivo. Esto resuelve el problema donde después de seleccionar
 * un archivo, no se puede volver a seleccionar el mismo archivo.
 */
export function clearFileInput(inputRef: React.RefObject<HTMLInputElement>) {
  if (inputRef.current) {
    inputRef.current.value = '';
    // Forzar un reset del input para asegurar que se pueda volver a usar
    inputRef.current.type = 'text';
    inputRef.current.type = 'file';
  }
}
