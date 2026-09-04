import { jams } from "../../config/jams";
import type { Locale } from "../i18n/types";
import { validateJamRounds } from "./status";

export function getJamStaticPaths(locale: Locale) {
  validateJamRounds(jams);
  return jams.map((round) => ({
    params: { slug: round.slug },
    props: { locale, round },
  }));
}
