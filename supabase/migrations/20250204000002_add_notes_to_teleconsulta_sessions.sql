-- Adicionar campo notes à tabela teleconsulta_sessions
ALTER TABLE teleconsulta_sessions 
ADD COLUMN notes TEXT;

-- Comentário sobre o campo
COMMENT ON COLUMN teleconsulta_sessions.notes IS 'Observações ou notas adicionais sobre a sessão de teleconsulta';