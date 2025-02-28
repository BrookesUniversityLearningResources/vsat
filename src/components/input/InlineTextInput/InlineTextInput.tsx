import {
  type FC,
  type KeyboardEventHandler,
  type PropsWithChildren,
  useId,
  useState,
} from "react";

import styles from "./InlineTextInput.module.css";

export type ChangeEvent = {
  value: string;
  oldValue: string;
};

export type OnChanged = (event: ChangeEvent) => void;

type InlineTextInputProps = PropsWithChildren<{
  initialValue: string;
  onChanged: OnChanged;
  i18n: {
    editing: {
      labelName: string;
      labelSave: string;
    };
    notEditing: {
      labelEdit: string;
    };
  };
  inputAttributes?: React.InputHTMLAttributes<HTMLInputElement>;
}>;

const InlineTextInput: FC<InlineTextInputProps> = ({
  children,
  initialValue,
  onChanged,
  i18n,
  inputAttributes = {},
}) => {
  const idInput = useId();

  const [isValid, setValid] = useState<boolean>(true);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [value, setValue] = useState<string>(initialValue);

  const onSave = () => {
    setEditing(false);

    const newValue = value.trim();

    if (newValue !== initialValue) {
      onChanged({ value: newValue, oldValue: initialValue });
    }
  };

  const onInput = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setValue(target.value);
    setValid(target.validity.valid);
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = ({ key }) => {
    switch (key) {
      case "Escape": {
        setEditing(false);
        setValue(initialValue);
        break;
      }

      case "Enter": {
        if (isValid) {
          onSave();
        }
        break;
      }

      default: {
        return;
      }
    }
  };

  if (isEditing) {
    return (
      <div className={styles.editing}>
        <label htmlFor={idInput}>{i18n.editing.labelName}</label>
        <div className={styles.inlineEditor}>
          <input
            {...inputAttributes}
            id={idInput}
            type="text"
            value={value}
            onInput={onInput}
            onKeyDown={onKeyDown}
          />
          <button type="button" onClick={onSave} disabled={!isValid}>
            <img
              src="/images/save.svg"
              alt={i18n.editing.labelSave}
              title={i18n.editing.labelSave}
            />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.notEditing}>
      {children}

      <button type="button" onClick={() => setEditing(true)}>
        <img
          src="/images/edit-white.svg"
          alt={i18n.notEditing.labelEdit}
          title={i18n.notEditing.labelEdit}
        />
      </button>
    </div>
  );
};

export default InlineTextInput;
