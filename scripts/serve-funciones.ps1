# Levanta las Edge Functions locales. Si existe tu archivo de claves de IA (FUERA de OneDrive), lo usa; si no, las
# funciones de IA responden "no está activada" y todo lo demás funciona igual.
#
# Uso (desde la carpeta del proyecto):   powershell -ExecutionPolicy Bypass -File scripts\serve-funciones.ps1
# El archivo de claves es:  %USERPROFILE%\.chasqui\ia.env   (ver docs/ia-configuracion.md)
$archivo = Join-Path $env:USERPROFILE '.chasqui\ia.env'
if (Test-Path $archivo) {
  Write-Host "Usando la configuración de IA de $archivo" -ForegroundColor Green
  supabase functions serve --env-file $archivo
} else {
  Write-Host "No encontré $archivo: las funciones de IA van a responder 'no está activada'." -ForegroundColor Yellow
  supabase functions serve
}
