# Golondrina

Asistente + automatización que aprende de cada usuario. Es **100% configurable**: la primera vez se presenta y ofrece configurarse (qué aprende, qué sugiere, qué tan rápido y de qué lado aparece); después se cambia con el botón ⚙ del asistente o escribiéndole «configurar».

- El motor vive en esta carpeta y no depende de React (usa Shadow DOM).
- Las acciones de RetailPOS están en `src/components/golondrina/golondrina-asistente.tsx`.
- Todo se guarda solo en el navegador del usuario (localStorage).
