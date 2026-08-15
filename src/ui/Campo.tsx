import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { T } from './T';
import { color, font, radius } from './tokens';

/** Campo de texto con etiqueta visible, ayuda persistente y error junto al campo. */
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
}) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <T v="eyebrow">{etiqueta}</T>
      <View
        style={[
          styles.caja,
          multilinea && { minHeight: 88, alignItems: 'flex-start' },
          foco && { borderColor: color.bordeJade },
          error ? { borderColor: 'rgba(255,77,94,0.5)' } : null,
        ]}
      >
        <TextInput
          value={valor}
          onChangeText={onCambio}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          placeholder={placeholder}
          placeholderTextColor={color.plumaTenue}
          keyboardType={teclado}
          multiline={multilinea}
          autoFocus={autoFoco}
          secureTextEntry={seguro}
          autoCapitalize={autoCapitalizar}
          autoCorrect={false}
          accessibilityLabel={etiqueta}
          style={[
            styles.input,
            multilinea && { textAlignVertical: 'top', paddingTop: 12 },
            { outlineStyle: 'none' } as object,
          ]}
        />
        {derecha}
      </View>
      {error ? (
        <T v="small" color={color.pecho} accessibilityLiveRegion="polite">
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
    borderColor: color.borde,
    backgroundColor: 'rgba(236,253,245,0.04)',
    paddingHorizontal: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    color: color.pluma,
    fontFamily: font.body,
    fontSize: 16,
    paddingVertical: 12,
  },
});
