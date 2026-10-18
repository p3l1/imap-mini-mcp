{{- define "imap-mini-mcp.name" -}}
{{- .Release.Name -}}
{{- end -}}

{{- define "imap-mini-mcp.image" -}}
{{- printf "%s:%s" .Values.image.repository (default .Chart.AppVersion .Values.image.tag) -}}
{{- end -}}
