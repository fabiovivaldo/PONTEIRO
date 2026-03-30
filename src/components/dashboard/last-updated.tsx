'use client';

import React, { useState, useEffect } from 'react';

interface LastUpdatedDisplayProps {
  date: string;
}

export function LastUpdatedDisplay({ date }: LastUpdatedDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const d = new Date(date);
    setFormattedDate(d.toLocaleString('pt-BR'));
  }, [date]);

  return <span>{formattedDate}</span>;
}
