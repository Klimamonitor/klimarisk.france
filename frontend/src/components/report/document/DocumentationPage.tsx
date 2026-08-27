import { Page, Text, View } from "@react-pdf/renderer";
import { reportStyles as s } from "./reportStyles";
import type { ReportSnapshot } from "./reportSnapshot";
// import { ordinal } from "../../../hooks/useLanguageStore";

interface Props {
  report: ReportSnapshot;
}

function DocumentationPage({ report }: Props) {
  const {
    l,
    t,
  } = report;

  return (
    <Page size="A4" style={s.page}>
    
      <Text 
        fixed
        style={s.pageNumber}
        render={({ pageNumber, totalPages }) => 
          `${pageNumber} / ${totalPages}`
        }
      />

      <View style={s.sidebanner} fixed></View>

      <View style={s.heading} bookmark={l(t.report.document.documentationPage.title)}>
        <Text style={s.title}>
          {l(t.report.document.documentationPage.title)}
        </Text>
      </View>
      
      {report.documentation!.map((doc, index) => (
        <View key={index} style={s.documentation.text}>
          <View style={s.documentation.bullet} />
          <Text>{l(doc)}</Text>
        </View>
      ))}

    </Page>
  )
}

export default DocumentationPage;