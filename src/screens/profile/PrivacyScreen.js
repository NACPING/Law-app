import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sections = [
  {
    title: 'ข้อมูลที่เราใช้',
    body: 'แอปใช้ข้อมูลบัญชี เช่น ชื่อ อีเมล และเบอร์โทรศัพท์ รวมถึงข้อมูลที่คุณส่งเมื่อใช้บริการปรึกษาทนายและชุมชน เพื่อให้บริการและดูแลความปลอดภัยของบัญชี',
  },
  {
    title: 'การใช้และการเปิดเผยข้อมูล',
    body: 'ข้อมูลจะถูกใช้เพื่อให้บริการ ติดต่อเกี่ยวกับคำขอของคุณ และปรับปรุงการทำงานของแอป เราจะไม่แสดงข้อมูลบัญชีของคุณต่อสาธารณะ เว้นแต่คุณเลือกเปิดเผยข้อมูลในเนื้อหาที่โพสต์ หรือมีเหตุจำเป็นตามกฎหมาย',
  },
  {
    title: 'การจัดเก็บและความปลอดภัย',
    body: 'เราดำเนินมาตรการที่เหมาะสมเพื่อป้องกันการเข้าถึงหรือเปิดเผยข้อมูลโดยไม่ได้รับอนุญาต คุณควรเก็บข้อมูลเข้าสู่ระบบไว้เป็นความลับและออกจากระบบเมื่อใช้อุปกรณ์ร่วมกับผู้อื่น',
  },
  {
    title: 'การจัดการข้อมูลของคุณ',
    body: 'คุณสามารถแก้ไขชื่อ นามสกุล และเบอร์โทรศัพท์ได้จากหน้าแก้ไขข้อมูลส่วนตัว หากต้องการสอบถามหรือต้องการใช้สิทธิ์เกี่ยวกับข้อมูลส่วนบุคคล โปรดติดต่อผู้ดูแลแอป',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          นโยบายนี้สรุปแนวทางการใช้ข้อมูลส่วนบุคคลเมื่อคุณใช้งานแอป โปรดตรวจสอบนโยบายฉบับเต็มและช่องทางติดต่อกับผู้ให้บริการก่อนเผยแพร่แอป
        </Text>
        <View style={styles.card}>
          {sections.map((section, index) => (
            <View
              key={section.title}
              style={[styles.section, index === sections.length - 1 && styles.lastSection]}
            >
              <Text style={styles.heading}>{section.title}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
  },
  intro: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  section: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  heading: {
    color: '#1E2B58',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 22,
  },
});
