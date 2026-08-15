import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { T } from './T';
import { color, font, radius, space } from './tokens';

/** Campo con etiqueta visible, ayuda persistente y error junto al campo. */
export function Campo({
  etiqueta,
  valor,
  onCambio,
  placeholder,
  error,
  ayuda,
  teclado,
  multilinea,
  autoFoco,
  derecha,
  seguro,
  autoCapitalizar = 'sentences',
  autoComplete,
  onSubmit,
  returnKeyType,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  ayuda?: string;
  teclado?: KeyboardTypeOptions;
  multilinea?: boolean;
  autoFoco?: boolean;
  derecha?: React.ReactNode;
  seguro?: boolean;
  autoCapitalizar?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputProps['autoComplete'];
  onSubmit?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
}) {
  const [foco, setFoco] = useState(false);

  return (
    <View style={{ gap: space.s }}>
      <T v="etiqueta">{etiqueta}</T>
      <View
        style={[
          styles.caja,
          multilinea && styles.cajaMulti,
          foco && styles.cajaFoco,
          error ? styles.cajaError : null,
        ]}
      >
        <TextInput
          value={valor}
          onChangeText={onCambio}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          placeholder={placeholder}
          placeholderTextColor={color.lapizTenue}
          keyboardType={teclado}
          multiline={multilinea}
          autoFocus={autoFoco}
          secureTextEntry={seguro}
          autoCapitalize={autoCapitalizar}
          autoComplete={autoComplete}
          autoCorrect={false}
          onSubmitEditing={onSubmit}
          returnKeyType={returnKeyType}
          accessibilityLabel={etiqueta}
          style={[
            styles.input,
            multilinea && styles.inputMulti,
            { outlineStyle: 'none' } as object,
          ]}
        />
        {derecha}
      </View>
      {error ? (
        <T v="small" color={color.sale} accessibilityLiveRegion="polite">
          {error}
        </T>
      ) : ayuda ? (
        <T v="small">{ayuda}</T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: color.trazo,
    backgroundColor: color.papelAlto,
    paddingHorizontal: 14,
    gap: space.s,
  },
  cajaMulti: { minHeight: 88, alignItems: 'flex-start' },
  cajaFoco: { borderColor: color.tinta, borderWidth: 2, paddingHorizontal: 13 },
  cajaError: { borderColor: color.sale },
  input: {
    flex: 1,
    color: color.grafito,
    fontFamily: font.cifra,
    fontSize: 16,
    paddingVertical: 12,
  },
  inputMulti: { textAlignVertical: 'top', paddingTop: 12 },
});
