const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MANAGER_URL="https://api.eitri.tech/eitri-manager-api/v2/revisions?eitriAppId="
const BLIND_GUARDIAN_URL="https://api.eitri.tech/blind-guardian-api/v2/o/auth"

const credentials = {
  client_id: process.env.EITRI_CLI_CLIENT_ID,
  client_secret: process.env.EITRI_CLI_CLIENT_SECRET,
  grant_type: "client_credentials",
};

async function authenticate() {
  try {
    const response = await fetch(BLIND_GUARDIAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro na autenticação");
    }

    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    console.error("Erro ao autenticar:", error.message);
    throw new Error("Falha na autenticação");
  }
}

function listProjects(directoryPath) {
  return fs
      .readdirSync(directoryPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((folder) => fs.existsSync(path.join(directoryPath, folder, "eitri-app.conf.js")));
}

async function getPublishedVersions(eitriAppId, token) {
  try {
    const response = await fetch(`${MANAGER_URL}${eitriAppId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Erro ao buscar versões para o ID ${eitriAppId}`);
    }

    const data = await response.json();

    // Provavelmente é a primeira versão a ser integrada
    if (!data.revisions || data.revisions.length == 0) {
      return "0.0.0"
    }

    const latestRevision = data.revisions.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    }, data.revisions[0]);

    return latestRevision.version; // Retorne apenas a versão
  } catch (error) {
    console.error(`Erro ao buscar versões para o ID ${eitriAppId}:`, error.message);
    throw new Error("Falha ao obter versões publicadas");
  }
}

function getProjectConfig(project, directoryPath) {
  const configPath = path.join(directoryPath, `./${project}/eitri-app.conf.js`);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Arquivo de configuração não encontrado: ${configPath}`);
  }
  const { version, id, sharedVersion, messageVersion, sharedCompiler } = require(configPath);
  const isShared = sharedVersion || sharedCompiler
  return {version, id, sharedVersion: isShared, messageVersion};
}

function isVersionGreater(localVersion, publishedVersion) {
  const parseVersion = (version) =>
      version.split('.').map((num) => parseInt(num, 10));

  const localParts = parseVersion(localVersion);
  const publishedParts = parseVersion(publishedVersion);

  for (let i = 0; i < Math.max(localParts.length, publishedParts.length); i++) {
    const localPart = localParts[i] || 0;
    const publishedPart = publishedParts[i] || 0;

    if (localPart > publishedPart) return true;
    if (localPart < publishedPart) return false;
  }
  return false; // As versões são iguais
}

async function checkAndPush() {
  console.log("Autenticando...");
  const token = await authenticate();
  console.log("Token obtido com sucesso!");

  await checkAndPushInDirectory(__dirname, token)
}

async function checkAndPushInDirectory(directoryPath, token) {
  try {
    const projects = listProjects(directoryPath);
    console.log("Projetos encontrados:", projects);

    for (const project of projects) {
      try {
        console.log(`Verificando versões para o projeto: ${project}`);
        const appConfig = getProjectConfig(project, directoryPath);
        const localVersion = appConfig.version
        const publishedVersions = await getPublishedVersions(appConfig.id, token);

        if (isVersionGreater(localVersion, publishedVersions)) {
          console.log(`${project}: Versão local (${localVersion}) é maior que a publicada ${publishedVersions}. Executando 'eitri push-version'...`);

          // Caminho absoluto para o diretório do projeto
          const projectPath = path.resolve(directoryPath, `./${project}`);

          // Muda para o diretório do projeto
          process.chdir(projectPath);

          // Executa o comando dentro do diretório do projeto
          const messageVersion = appConfig.messageVersion || ''
          execSync(`eitri push-version -m '${messageVersion}' ${appConfig.sharedVersion ? '--shared' : ''}`, { stdio: "inherit" });

          // Volta para o diretório original (opcional)
          process.chdir(directoryPath);
        } else {
          console.log(`Nenhuma ação necessária para o projeto: ${project}`);
        }
      } catch (error) {
        console.error(`Erro ao processar o projeto ${project}:`, error.message);
      }
    }

  } catch(error) {
    console.error(error);
  }
}

checkAndPush();

