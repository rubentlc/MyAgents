igit
Guia de instalação e configuração do igit.

1. Instalação do Script
Cria o diretório e o ficheiro do script:

mkdir -p ~/igit
cd ~/igit
touch igit

Abre o ficheiro no VS Code para colar o código fonte:

code igit

Torna o ficheiro executável:

chmod +x igit

2. Configuração do PATH
Adiciona o diretório ao teu PATH no ficheiro ~/.zshrc:

echo 'export PATH="$PATH:$HOME/igit"' >> ~/.zshrc
source ~/.zshrc

Nota: Se o comando não for reconhecido, verifica se a linha no teu ~/.zshrc utiliza $HOME/igit em vez de ~/igit.

3. Configuração do Autocomplete
Cria a pasta para as definições de autocomplete:

mkdir -p ~/.zsh/completions
code ~/.zsh/completions/_igit

Cola o script de autocomplete no ficheiro aberto.

Atualiza o teu ~/.zshrc adicionando (ou garantindo que existem) estas linhas:

igit
export PATH="$PATH:$HOME/igit"

fpath=($HOME/.zsh/completions $fpath)

autoload -Uz compinit
compinit -u

Aplica as alterações:

source ~/.zshrc

4. Testar a Instalação
Verifica se tudo está operacional executando:

igit list