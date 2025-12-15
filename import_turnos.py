#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar turnos desde el archivo Excel 2025.xlsx
Genera un JSON limpio con los datos de pacientes y turnos
"""

import pandas as pd
import json
import os
import datetime
from datetime import timedelta
import re

all_patients = []

def parse_time(t_str):
    """Convierte string de tiempo a objeto time"""
    try:
        return datetime.datetime.strptime(str(t_str), "%H:%M:%S").time()
    except:
        try:
            return datetime.datetime.strptime(str(t_str), "%H:%M").time()
        except:
            return None

def clean_name(name):
    """Limpia el nombre eliminando DNI, teléfonos y otros datos extra"""
    if not isinstance(name, str):
        return ""
    
    # Convertir a string y quitar espacios extras
    name = name.strip()
    
    # Remover guiones y lo que viene después (a veces tienen "- DNI")
    if '-' in name:
        parts = name.split('-')
        name = parts[0].strip()
    
    # Remover números de teléfono (patrones comunes en Argentina)
    # Ej: (11) 1234-5678, 11-1234-5678, 1151234567
    name = re.sub(r'\(?\d{2,4}\)?\s*-?\s*\d{4}\s*-?\s*\d{4}', '', name)
    name = re.sub(r'\d{10,11}', '', name)  # Números de 10-11 dígitos
    
    # Remover DNI (puede estar al inicio o final)
    # Patrones: DNI 12345678, DNI:12345678, 12345678 (DNI)
    name = re.sub(r'DNI\s*:?\s*\d{7,8}', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\d{7,8}\s*\(?DNI\)?', '', name, flags=re.IGNORECASE)
    
    # Remover solo números sueltos largos (probablemente DNI)
    name = re.sub(r'\b\d{7,}\b', '', name)
    
    # Remover caracteres especiales al inicio/final
    name = re.sub(r'^[^\w]+|[^\w]+$', '', name)
    
    # Capitalizar correctamente (primera letra de cada palabra)
    name = ' '.join(word.capitalize() if word else '' for word in name.split())
    
    # Limpiar espacios múltiples
    name = ' '.join(name.split())
    
    return name.strip()

def extract_date_from_string(date_str):
    """Extrae fecha del string, puede venir en varios formatos"""
    if not isinstance(date_str, str):
        return None
    
    date_str = date_str.strip()
    
    # Buscar año 2025 en el string
    if '2025' not in date_str:
        return None
    
    # Intentar extraer fecha en formato DD/MM/YYYY o similar
    date_patterns = [
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
        r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, date_str)
        if match:
            try:
                if len(match.groups()) == 3:
                    parts = match.groups()
                    # Detectar formato
                    if len(parts[0]) == 4:  # YYYY-MM-DD
                        return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                    else:  # DD-MM-YYYY o DD/MM/YYYY
                        return f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
            except:
                pass
    
    # Si no se puede parsear, usar el string completo si contiene 2025
    if '2025' in date_str:
        # Intentar extraer al menos año-mes-día básico
        return date_str
    
    return None

# Recorremos todas las hojas (semanas)
for i in range(1, 53):
    filename = f"2025.xlsx"
    sheet_name = f"Hoja{i}"
    
    if not os.path.exists(filename):
        print(f"Archivo {filename} no encontrado")
        continue
    
    try:
        # Intentar leer la hoja
        df = pd.read_excel(filename, sheet_name=sheet_name, header=None)
    except Exception as e:
        # Si la hoja no existe, continuar
        continue
    
    if df.empty:
        continue
    
    col_dates = {}
    row_0 = df.iloc[0]
    
    # Detectar fechas en columnas
    for col_idx in range(1, len(df.columns)):
        if col_idx < len(row_0):
            val = row_0.iloc[col_idx]
            if pd.notna(val):
                val_str = str(val).strip()
                if '2025' in val_str:
                    date_parsed = extract_date_from_string(val_str)
                    if date_parsed:
                        col_dates[col_idx] = date_parsed
    
    if not col_dates:
        continue
    
    last_valid_time = None
    
    # Extraer datos de cada fila
    for row_idx in range(1, len(df)):
        row = df.iloc[row_idx]
        
        if len(row) == 0:
            continue
        
        time_cell = row.iloc[0] if len(row) > 0 else None
        
        if pd.notna(time_cell):
            current_time = parse_time(time_cell)
            if current_time:
                last_valid_time = current_time
        elif last_valid_time:
            # Si no hay tiempo pero hay uno previo, sumar 30 minutos
            dummy = datetime.datetime(2000, 1, 1, last_valid_time.hour, last_valid_time.minute)
            current_time = (dummy + timedelta(minutes=30)).time()
            last_valid_time = current_time
        else:
            continue
        
        # Procesar cada columna con fecha
        for col_idx, date_str in col_dates.items():
            if col_idx < len(row):
                patient_raw = row.iloc[col_idx]
                
                if pd.notna(patient_raw):
                    patient_raw_str = str(patient_raw).strip()
                    
                    # Filtrar valores inválidos
                    if patient_raw_str.lower() not in ['nan', 'none', '', ' ']:
                        nombre_limpiado = clean_name(patient_raw_str)
                        
                        if nombre_limpiado and len(nombre_limpiado) > 2:  # Al menos 3 caracteres
                            try:
                                # Formatear fecha y hora
                                fecha_hora_str = f"{date_str} {current_time.strftime('%H:%M:%S')}"
                                
                                all_patients.append({
                                    "nombre": nombre_limpiado,
                                    "fecha_hora": fecha_hora_str,
                                    "nombre_original": patient_raw_str  # Guardar original para referencia
                                })
                            except Exception as e:
                                print(f"Error procesando: {patient_raw_str} - {e}")
                                continue

print(f"\nTotal de registros encontrados: {len(all_patients)}\n")

# Guardar en archivo JSON
output_file = "turnos_2025_import.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_patients, f, ensure_ascii=False, indent=2)

print(f"Archivo JSON generado: {output_file}")
print(f"Total de registros: {len(all_patients)}")

