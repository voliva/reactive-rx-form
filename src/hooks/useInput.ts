import { useEffect, useRef } from 'react';
import { FormRef, getControlState } from '../internal/formRef';
import { getKey, getMapValue, KeySelector } from '../internal/path';
import { FieldValidator } from '../validators';

export const useInput = <TValues, T>(
  formRef: FormRef<TValues>,
  options: {
    elementProp?: string;
    eventType?: 'input' | 'onChange';
    key?: KeySelector<TValues, T>;
    validator?: FieldValidator<T, TValues>;
    initialValue?: string | boolean;
  } = {}
) => {
  const { eventType = 'input', elementProp = 'value' } = options;
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const { initialValue = '', validator } = options;
    const key: string = options.key ? getKey(options.key) : element.name;
    if (!key) {
      console.error(
        "An input is missing its key. Either supply it through useInput `key` option or through the input's name",
        element,
        { options }
      );
      return;
    }
    formRef.registerControl({
      initialValue,
      key,
      validator,
    });

    const value$ = getMapValue(key, formRef.values);
    const valueUnsub = value$.subscribe(value => {
      if ((element as any)[elementProp] !== value) {
        (element as any)[elementProp] = value;
      }
    });

    const blurListener = () => {
      const control$ = getControlState(formRef, key);
      if (control$.getValue().touched) return;
      control$.setValue({
        ...control$.getValue(),
        touched: true,
      });
    };
    element.addEventListener('blur', blurListener);
    const valueListener = (event: any) =>
      value$.setValue(event.target[elementProp]);
    element.addEventListener(eventType, valueListener);

    return () => {
      valueUnsub();
      element.removeEventListener('blur', blurListener);
      element.removeEventListener(eventType, valueListener);
    };
  });

  return ref;
};
