import { isEmpty, omit } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { atom, useRecoilState } from 'recoil';
import { useENSRegistration } from '.';
import { Records } from '@rainbow-me/entities';
import {
  ENS_RECORDS,
  REGISTRATION_MODES,
  textRecordFields,
} from '@rainbow-me/helpers/ens';

const disabledAtom = atom({
  default: false,
  key: 'ensProfileForm.disabled',
});

const errorsAtom = atom<{ [name: string]: string }>({
  default: {},
  key: 'ensProfileForm.errors',
});

const selectedFieldsAtom = atom({
  default: [],
  key: 'ensProfileForm.selectedFields',
});

const submittingAtom = atom({
  default: false,
  key: 'ensProfileForm.submitting',
});

export const valuesAtom = atom<{ [name: string]: Partial<Records> }>({
  default: {},
  key: 'ensProfileForm.values',
});

export default function useENSRegistrationForm({
  defaultFields,
  createForm,
}: {
  defaultFields?: any[];
  /** A flag that indicates if a new form should be initialised */
  createForm?: boolean;
} = {}) {
  const {
    name,
    mode,
    changedRecords,
    initialRecords,
    records: allRecords,
    profileQuery,
    removeRecordByKey,
    updateRecordByKey,
    updateRecords,
  } = useENSRegistration();

  // The initial records will be the existing records belonging to the profile in "edit mode",
  // but will be all of the records in "create mode".
  const isPrimaryDisplayRecords = useMemo(
    () => (mode === REGISTRATION_MODES.EDIT ? initialRecords : allRecords),
    [allRecords, initialRecords, mode]
  );

  const [errors, setErrors] = useRecoilState(errorsAtom);
  const [submitting, setSubmitting] = useRecoilState(submittingAtom);

  const [disabled, setDisabled] = useRecoilState(disabledAtom);
  useEffect(() => {
    // If we are in edit mode, we want to disable the "Review" button
    // when there are no changed records.
    // Note: We don't want to do this in create mode as we have the "Skip"
    // button.
    setDisabled(
      mode === REGISTRATION_MODES.EDIT ? isEmpty(changedRecords) : false
    );
  }, [changedRecords, disabled, mode, setDisabled]);

  const [selectedFields, setSelectedFields] = useRecoilState(
    selectedFieldsAtom
  );
  useEffect(() => {
    if (createForm) {
      // If there are existing records in the global state, then we
      // populate with that.
      if (!isEmpty(isPrimaryDisplayRecords)) {
        setSelectedFields(
          // @ts-ignore
          Object.keys(isPrimaryDisplayRecords)
            // @ts-ignore
            .map(key => textRecordFields[key])
            .filter(x => x)
        );
      } else {
        if (defaultFields) {
          setSelectedFields(defaultFields as any);
        }
      }
    }
  }, [name, isEmpty(isPrimaryDisplayRecords)]); // eslint-disable-line react-hooks/exhaustive-deps

  const [valuesMap, setValuesMap] = useRecoilState(valuesAtom);
  const values = useMemo(() => valuesMap[name] || {}, [name, valuesMap]);
  useEffect(
    () => {
      if (createForm) {
        setValuesMap(values => ({ ...values, [name]: isPrimaryDisplayRecords }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, isEmpty(isPrimaryDisplayRecords)]
  );

  // Set initial records in redux depending on user input (defaultFields)
  useEffect(() => {
    if (defaultFields && isEmpty(isPrimaryDisplayRecords)) {
      const records = defaultFields.reduce((records, field) => {
        return {
          ...records,
          [field.key]: '',
        };
      }, {});
      updateRecords(records);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty(isPrimaryDisplayRecords), updateRecords]);

  const onAddField = useCallback(
    (fieldToAdd, selectedFields) => {
      setSelectedFields(selectedFields);
      updateRecordByKey(fieldToAdd.key, '');
    },
    [setSelectedFields, updateRecordByKey]
  );

  const onRemoveField = useCallback(
    (fieldToRemove, selectedFields) => {
      if (!isEmpty(errors)) {
        setErrors(errors => {
          const newErrors = omit(errors, fieldToRemove.key);
          return newErrors;
        });
      }
      setSelectedFields(selectedFields);
      removeRecordByKey(fieldToRemove.key);
      setValuesMap(values => ({
        ...values,
        [name]: omit(values?.[name] || {}, fieldToRemove.key) as Records,
      }));
    },
    [
      errors,
      name,
      removeRecordByKey,
      setErrors,
      setSelectedFields,
      setValuesMap,
    ]
  );

  const onBlurField = useCallback(
    ({ key, value }) => {
      setValuesMap(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
      updateRecordByKey(key, value);
    },
    [name, setValuesMap, updateRecordByKey]
  );

  const onChangeField = useCallback(
    ({ key, value }) => {
      if (!isEmpty(errors)) {
        setErrors(errors => {
          const newErrors = omit(errors, key);
          return newErrors;
        });
      }

      setValuesMap(values => ({
        ...values,
        [name]: { ...values?.[name], [key]: value },
      }));
      updateRecordByKey(key, value);
    },
    [errors, name, setErrors, setValuesMap, updateRecordByKey]
  );

  const blurFields = useCallback(() => {
    updateRecords(values);
  }, [updateRecords, values]);

  const [isLoading, setIsLoading] = useState(mode === REGISTRATION_MODES.EDIT);
  useEffect(() => {
    if (!profileQuery.isLoading) {
      setTimeout(() => setIsLoading(false), 200);
    } else {
      setIsLoading(true);
    }
  }, [profileQuery.isLoading]);

  const empty = useMemo(() => !Object.values(values).some(Boolean), [values]);

  const submit = useCallback(
    async submitFn => {
      const errors = Object.entries(textRecordFields).reduce(
        (currentErrors, [key, { validations }]) => {
          const value = values[key as ENS_RECORDS];
          if (validations?.onSubmit?.match) {
            const { value: regex, message } =
              validations?.onSubmit?.match || {};
            if (regex && value && !value.match(regex)) {
              return {
                ...currentErrors,
                [key]: message,
              };
            }
          }
          if (validations?.onSubmit?.validate) {
            const { callback, message } = validations?.onSubmit?.validate || {};
            if (value && !callback(value)) {
              return {
                ...currentErrors,
                [key]: message,
              };
            }
          }
          return currentErrors;
        },
        {}
      );
      setErrors(errors);

      setSubmitting(true);
      if (isEmpty(errors)) {
        try {
          await submitFn();
          // eslint-disable-next-line no-empty
        } catch (err) {}
      }
      setTimeout(() => {
        setSubmitting(false);
      }, 100);
    },
    [setErrors, setSubmitting, values]
  );

  return {
    blurFields,
    disabled,
    errors,
    isEmpty: empty,
    isLoading,
    onAddField,
    onBlurField,
    onChangeField,
    onRemoveField,
    selectedFields,
    setDisabled,
    submit,
    submitting,
    values,
  };
}
