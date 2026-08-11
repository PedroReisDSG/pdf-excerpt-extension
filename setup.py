#!/usr/bin/env python3
"""
Script para baixar as bibliotecas necessarias para a extensao PDF Excerpt Extractor
"""

import os
import urllib.request
import zipfile
import shutil

def download_file(url, destination):
    """Baixa um arquivo da URL para o destino especificado"""
    print(f"Baixando {url}...")
    try:
        urllib.request.urlretrieve(url, destination)
        print(f"Download concluido: {destination}")
        return True
    except Exception as e:
        print(f"Erro ao baixar {url}: {e}")
        return False

def extract_zip(zip_path, extract_to):
    """Extrai um arquivo ZIP"""
    print(f"Extraindo {zip_path}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        print(f"Extracao concluida em {extract_to}")
        return True
    except Exception as e:
        print(f"Erro ao extrair {zip_path}: {e}")
        return False

def main():
    # Cria diretorio libs se nao existir
    os.makedirs('libs', exist_ok=True)
    
    print("="*60)
    print("PDF Excerpt Extractor - Setup de Bibliotecas")
    print("="*60)
    print()
    
    # 1. Baixar PDF.js
    print("1. Baixando PDF.js...")
    pdfjs_url = "https://github.com/mozilla/pdf.js/releases/download/v4.0.379/pdfjs-4.0.379-dist.zip"
    pdfjs_zip = "pdfjs-dist.zip"
    
    if download_file(pdfjs_url, pdfjs_zip):
        extract_zip(pdfjs_zip, 'pdfjs-temp')
        
        # Copiar arquivos necessarios
        pdfjs_build = 'pdfjs-temp/build'
        if os.path.exists(pdfjs_build):
            for file in ['pdf.min.js', 'pdf.worker.min.js']:
                src = os.path.join(pdfjs_build, file)
                dst = os.path.join('libs', file)
                if os.path.exists(src):
                    shutil.copy2(src, dst)
                    print(f"  Copiado: {file}")
                else:
                    print(f"  AVISO: {file} nao encontrado")
        
        # Limpar temporarios
        shutil.rmtree('pdfjs-temp', ignore_errors=True)
        os.remove(pdfjs_zip)
    else:
        print("  Falha ao baixar PDF.js - tente manualmente")
    
    print()
    
    # 2. Baixar pdf-lib
    print("2. Baixando pdf-lib...")
    pdflib_url = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"
    pdflib_dst = os.path.join('libs', 'pdf-lib.min.js')
    
    if download_file(pdflib_url, pdflib_dst):
        print("  pdf-lib baixado com sucesso")
    else:
        print("  Falha ao baixar pdf-lib - tente manualmente")
        print("  URL alternativa: https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js")
    
    print()
    print("="*60)
    print("Setup concluido!")
    print("="*60)
    print()
    print("Verifique a pasta 'libs/' para confirmar os arquivos:")
    print("  - pdf.min.js")
    print("  - pdf.worker.min.js")
    print("  - pdf-lib.min.js")
    print()
    print("Se algum arquivo estiver faltando, baixe manualmente:")
    print("  PDF.js: https://github.com/mozilla/pdf.js/releases")
    print("  pdf-lib: https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js")

if __name__ == '__main__':
    main()
