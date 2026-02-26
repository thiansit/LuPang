import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883');
const TOPIC_CMD = 'claude/browser/command';
const TOPIC_RES = 'claude/browser/response';

const url = process.argv[2] || 'https://www.youtube.com/watch?v=XpHMle5Vq80';

async function send(action: string, params: any = {}): Promise<any> {
  return new Promise((resolve) => {
    const id = `${action}_${Date.now()}`;
    const timeout = setTimeout(() => resolve({ timeout: true }), 10000);
    const handler = (topic: string, msg: Buffer) => {
      if (topic !== TOPIC_RES) return;
      const data = JSON.parse(msg.toString());
      if (data.id === id) {
        clearTimeout(timeout);
        client.off('message', handler);
        resolve(data);
      }
    };
    client.on('message', handler);
    client.publish(TOPIC_CMD, JSON.stringify({ id, action, ...params }));
  });
}

async function main() {
  await new Promise(r => client.on('connect', r));
  client.subscribe(TOPIC_RES);

  console.log('\n FULL TRANSCRIBE FLOW\n');
  console.log('Video:', url);

  // 1. Create tab
  console.log('\n1  Creating tab...');
  const tab = await send('create_tab');
  const tabId = tab.tabId;
  console.log('   Tab:', tabId);

  // 2. Wait for load
  console.log('2  Waiting 4s...');
  await new Promise(r => setTimeout(r, 4000));

  // 3. Select fast model
  console.log('3  Selecting Fast model...');
  await send('select_model', { tabId, model: 'fast' });
  await new Promise(r => setTimeout(r, 1000));

  // 4. Send transcribe prompt
  console.log('4  Sending transcribe prompt...');
  const prompt = `Transcribe this YouTube video with timestamps:

${url}

Format each section like:
[0:00] Introduction - speaker introduces topic
[0:30] Step 1 - description
[1:00] Step 2 - description

Include ALL spoken content minute by minute.`;

  await send('chat', { tabId, text: prompt });
  console.log('    Sent!');

  // 5. Click "Try now" if needed
  console.log('5  Clicking "Try now" if visible...');
  await new Promise(r => setTimeout(r, 2000));
  await send('click_text', { tabId, text: 'Try now' });

  console.log('\n Waiting 30s for transcription...');
  await new Promise(r => setTimeout(r, 30000));

  // 6. Get response
  console.log('6  Getting response...');
  const response = await send('get_response', { tabId });

  console.log('\n=== TRANSCRIPTION ===\n');
  console.log(response.answer || response.error || 'No response');
  console.log('\n=== END ===\n');

  client.end();
}

main().catch(console.error);
