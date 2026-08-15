import React from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '../state/app';

/** Puerta de entrada: con wallet → tabs; sin wallet → bienvenida. */
export default function Gate() {
  const onboarded = useApp((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)' : '/bienvenida'} />;
}
