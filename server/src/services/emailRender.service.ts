import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";
import mjml2html from "mjml";
import { createModuleLogger } from "../utils/logger";
import { env } from "../configs/env";
import { clientAssets } from "../constants/client.constant";

const log = createModuleLogger(import.meta.url);

// Register Handlebars helpers
Handlebars.registerHelper("currentYear", () => {
  return new Date().getFullYear().toString();
});

Handlebars.registerHelper("eq", (a, b) => {
  return a === b;
});

Handlebars.registerHelper("gt", (a, b) => {
  return Number(a) > Number(b);
});

interface RenderEmailOptions<T = Record<string, unknown>> {
  templateName: string;
  data: T;
}

const getTemplatePath = (templateName: string): string => {
  const baseDir =
    env.NODE_ENV === "production" ? "dist/resources" : "resources";
  return path.join(process.cwd(), baseDir, "templates/emails", templateName);
};

const loadTemplate = async (filePath: string): Promise<string> => {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    log.error(`Email template not found at ${filePath}: ${error}`);
    throw new Error(`Email template not found: ${filePath}`);
  }
};

const compileTemplate = <T>(source: string, data: T): string => {
  try {
    const template = Handlebars.compile(source);
    return template(data);
  } catch (error) {
    log.error(`Error compiling Handlebars template: ${error}`);
    throw new Error("Error compiling Handlebars template");
  }
};

const convertToHtml = async (mjml: string): Promise<string> => {
  const { html, errors } = await mjml2html(mjml, {
    validationLevel: "soft",
  });

  if (errors && errors.length > 0) {
    log.warn("MJML compilation warnings: " + errors?.[0]?.formattedMessage);
  }

  return html;
};

export const renderEmail = async <T>({
  templateName,
  data,
}: RenderEmailOptions<T>): Promise<string> => {
  const templatePath = getTemplatePath(templateName);
  const source = await loadTemplate(templatePath);

  const mergedContext = {
    clientUrl: env.CLIENT_URL || "http://localhost:3000",
    logoFullUrl: clientAssets.LOGO_FULL,
    appName: clientAssets.APP_NAME,
    supportEmail: clientAssets.SUPPORT_EMAIL,
    ...(data as Record<string, unknown>),
  };

  const mjmlWithData = compileTemplate(source, mergedContext);
  const html = await convertToHtml(mjmlWithData);

  return html;
};
