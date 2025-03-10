import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, Folder, ChevronRight, Reply, Home, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';

// CP437 to Unicode conversion table
const cp437ToUnicode = [
  '\u0000', '☺', '☻', '♥', '♦', '♣', '♠', '•', '◘', '○', '◙', '♂', '♀', '♪', '♫', '☼',
  '►', '◄', '↕', '‼', '¶', '§', '▬', '↨', '↑', '↓', '→', '←', '∟', '↔', '▲', '▼',
  ' ', '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
  '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_',
  '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', '⌂',
  'Ç', 'ü', 'é', 'â', 'ä', 'à', 'å', 'ç', 'ê', 'ë', 'è', 'ï', 'î', 'ì', 'Ä', 'Å',
  'É', 'æ', 'Æ', 'ô', 'ö', 'ò', 'û', 'ù', 'ÿ', 'Ö', 'Ü', '¢', '£', '¥', '₧', 'ƒ',
  'á', 'í', 'ó', 'ú', 'ñ', 'Ñ', 'ª', 'º', '¿', '⌐', '¬', '½', '¼', '¡', '«', '»',
  '░', '▒', '▓', '│', '┤', '╡', '╢', '╖', '╕', '╣', '║', '╗', '╝', '╜', '╛', '┐',
  '└', '┴', '┬', '├', '─', '┼', '╞', '╟', '╚', '╔', '╩', '╦', '╠', '═', '╬', '╧',
  '╨', '╤', '╥', '╙', '╘', '╒', '╓', '╫', '╪', '┘', '┌', '█', '▄', '▌', '▐', '▀',
  'α', 'ß', 'Γ', 'π', 'Σ', 'σ', 'µ', 'τ', 'Φ', 'Θ', 'Ω', 'δ', '∞', 'φ', 'ε', '∩',
  '≡', '±', '≥', '≤', '⌠', '⌡', '÷', '≈', '°', '∙', '·', '√', 'ⁿ', '²', '■', ' '
];

const decodeCP437 = (bytes) => {
  return Array.from(bytes)
    .map(byte => cp437ToUnicode[byte])
    .join('');
};

const QWKReader = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConf, setSelectedConf] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [bbsInfo, setBBSInfo] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(true);
  const [fullWidthThread, setFullWidthThread] = useState(false);
  
  // Reset full width mode when going back to conference list
  useEffect(() => {
    if (!selectedConf) {
      setFullWidthThread(false);
    }
  }, [selectedConf]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) {
      return "Unknown date";
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Parse date from message
  const parseDate = (msg) => {
    try {
      const dateParts = msg.date.split('-');
      if (dateParts.length !== 3) return new Date(); // Invalid format
      
      const timeParts = msg.time.split(':');
      if (timeParts.length !== 2) return new Date(); // Invalid format
      
      let month = parseInt(dateParts[0], 10) - 1; // 0-based months
      let day = parseInt(dateParts[1], 10);
      let year = parseInt(dateParts[2], 10);
      
      // Y2K handling
      if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }
      
      const hour = parseInt(timeParts[0], 10);
      const minute = parseInt(timeParts[1], 10);
      
      return new Date(year, month, day, hour, minute);
    } catch (e) {
      console.error('Failed to parse date:', msg.date, msg.time, e);
      return new Date(); // Return current date as fallback
    }
  };

  const handleFilesUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    try {
      setError(null);
      console.log('Processing files:', Array.from(files).map(f => f.name));

      // First find and process CONTROL.DAT
      const controlFile = Array.from(files).find(f => f.name.toUpperCase() === 'CONTROL.DAT');
      if (!controlFile) {
        throw new Error('CONTROL.DAT not found');
      }

      const controlData = await controlFile.text();
      const lines = controlData.split('\n').map(line => line.trim());
      
      // Extract BBS info from CONTROL.DAT
      const bbsName = lines[0];
      const bbsLocation = lines[1];
      const bbsPhone = lines[2];
      const bbsSysop = lines[3];
      const packetDate = lines[5];
      const username = lines[6];
      
      setBBSInfo({
        name: bbsName,
        location: bbsLocation,
        phone: bbsPhone,
        sysop: bbsSysop,
        packetDate: packetDate,
        username: username
      });
      
      // Line 11 has conference count (minus 1)
      const confCount = parseInt(lines[10], 10) + 1;
      console.log('Conference count:', confCount);

      // Process conference list
      const confs = [];
      let lineIndex = 11;
      while (confs.length < confCount && lineIndex < lines.length - 1) {
        const confNum = parseInt(lines[lineIndex], 10);
        const confName = lines[lineIndex + 1].trim();
        if (!isNaN(confNum)) {
          confs.push({
            number: confNum,
            name: confName
          });
        }
        lineIndex += 2;
      }

      // Find and process MESSAGES.DAT
      const messagesFile = Array.from(files).find(f => f.name.toUpperCase() === 'MESSAGES.DAT');
      if (!messagesFile) {
        throw new Error('MESSAGES.DAT not found');
      }

      const messagesBuffer = await messagesFile.arrayBuffer();
      const messagesData = new Uint8Array(messagesBuffer);
      const messages = [];
      let offset = 128; // Skip copyright block

      while (offset + 128 <= messagesData.length) {
        const block = messagesData.slice(offset, offset + 128);
        const status = String.fromCharCode(block[0]);
        
        // Valid status characters
        if (" -+*~`%^!#$".includes(status)) {
          const messageLength = parseInt(decodeCP437(block.slice(116, 122)).trim(), 10);
          if (!isNaN(messageLength) && messageLength > 0) {
            const confNum = block[123] + (block[124] << 8);
            const message = {
              status,
              number: decodeCP437(block.slice(1, 8)).trim(),
              date: decodeCP437(block.slice(8, 16)).trim(),
              time: decodeCP437(block.slice(16, 21)).trim(),
              to: decodeCP437(block.slice(21, 46)).trim(),
              from: decodeCP437(block.slice(46, 71)).trim(),
              subject: decodeCP437(block.slice(71, 96)).trim(),
              replyTo: decodeCP437(block.slice(108, 116)).trim(),
              conference: confNum,
              body: ''
            };

            // Read message body blocks
            let bodyOffset = offset + 128;
            for (let i = 1; i < messageLength; i++) {
              if (bodyOffset + 128 <= messagesData.length) {
                const bodyBlock = messagesData.slice(bodyOffset, bodyOffset + 128);
                const text = decodeCP437(bodyBlock)
                  .replace(/\u0000/g, '') // Remove null bytes
                  .replace(/[\u03C0]/g, '\n'); // Replace π with newline
                
                message.body += text;
                bodyOffset += 128;
              }
            }

            message.body = message.body.trim();
            messages.push(message);
            offset = bodyOffset;
            continue;
          }
        }
        offset += 128;
      }

      console.log('Total messages found:', messages.length);

      // Process conferences and build threads
      const processedConfs = [];
      
      for (const conf of confs) {
        // Get all messages for this conference
        const confMsgs = messages.filter(m => m.conference === conf.number);
        
        // Skip empty conferences
        if (confMsgs.length === 0) {
          continue;
        }
        
        // Create message lookup map
        const msgMap = new Map();
        confMsgs.forEach(msg => msgMap.set(msg.number, msg));
        
        // Create a map to track all replies to a message
        const allReplies = new Map();
        confMsgs.forEach(msg => {
          const replyTo = msg.replyTo?.trim();
          if (replyTo && replyTo !== '0' && replyTo !== '') {
            if (!allReplies.has(replyTo)) {
              allReplies.set(replyTo, []);
            }
            allReplies.get(replyTo).push(msg);
          }
        });
        
        // Find all messages that are part of threads
        const partOfThread = new Set();
        
        // First, find all replies to existing messages
        const directThreads = [];
        confMsgs.forEach(msg => {
          // Is this a thread root?
          if (allReplies.has(msg.number)) {
            // This message has replies - it's a thread root
            const replies = [];
            
            // Helper function to collect all replies in a thread
            const collectReplies = (replyId) => {
              if (allReplies.has(replyId)) {
                allReplies.get(replyId).forEach(reply => {
                  replies.push(reply);
                  partOfThread.add(reply.number);
                  collectReplies(reply.number);
                });
              }
            };
            
            // Collect all replies recursively
            collectReplies(msg.number);
            
            // Create thread
            directThreads.push({
              root: msg,
              replies: [...replies].sort((a, b) => parseDate(a) - parseDate(b))
            });
            
            // Mark thread root as processed
            partOfThread.add(msg.number);
          }
        });
        
        // Second, handle threads with missing root messages
        const missingRootThreads = [];
        allReplies.forEach((replies, rootId) => {
          // Skip if all replies are already part of a thread
          if (replies.every(r => partOfThread.has(r.number))) return;
          
          // Skip if the root exists
          if (msgMap.has(rootId)) return;
          
          // Filter replies that aren't part of another thread
          const availableReplies = replies.filter(r => !partOfThread.has(r.number));
          if (availableReplies.length === 0) return;
          
          // Sort by date
          availableReplies.sort((a, b) => parseDate(a) - parseDate(b));
          
          // Use oldest as de facto root
          const defactoRoot = availableReplies.shift();
          const threadReplies = [];
          
          // Mark de facto root as processed
          partOfThread.add(defactoRoot.number);
          
          // Add the rest of the direct replies
          availableReplies.forEach(r => {
            threadReplies.push(r);
            partOfThread.add(r.number);
          });
          
          // Collect any replies to these messages
          const collectReplies = (replyId) => {
            if (allReplies.has(replyId)) {
              allReplies.get(replyId).forEach(reply => {
                if (!partOfThread.has(reply.number)) {
                  threadReplies.push(reply);
                  partOfThread.add(reply.number);
                  collectReplies(reply.number);
                }
              });
            }
          };
          
          // Collect nested replies for all direct replies
          availableReplies.forEach(r => collectReplies(r.number));
          
          // Create thread
          missingRootThreads.push({
            root: defactoRoot,
            replies: threadReplies.sort((a, b) => parseDate(a) - parseDate(b))
          });
        });
        
        // Finally, add standalone messages
        const standaloneThreads = confMsgs
          .filter(msg => !partOfThread.has(msg.number))
          .map(msg => ({
            root: msg,
            replies: []
          }));
        
        // Combine all threads and sort by date
        const allThreads = [
          ...directThreads,
          ...missingRootThreads,
          ...standaloneThreads
        ].sort((a, b) => parseDate(a.root) - parseDate(b.root));
        
        // Filter out threads that are part of other threads
        const displayThreads = allThreads.filter(thread => {
          // Check if this thread's root is a reply in another thread
          return !allThreads.some(otherThread => 
            otherThread.replies.some(reply => reply.number === thread.root.number)
          );
        });
        
        // Find the newest message date
        const newestDate = new Date(Math.max(...confMsgs.map(msg => parseDate(msg).getTime())));

        processedConfs.push({
          ...conf,
          threads: allThreads,
          displayThreads: displayThreads,
          messageCount: confMsgs.length,
          newestDate: newestDate
        });
      }

      setConferences(processedConfs.sort((a, b) => a.number - b.number));
      setStats({
        totalConferences: processedConfs.length,
        totalMessages: messages.length
      });
    } catch (error) {
      console.error('Error processing files:', error);
      setError(error.message);
    }
  };

  // Get breadcrumbs based on current view
  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    breadcrumbs.push({ name: 'Conferences', onClick: () => { setSelectedConf(null); setSelectedThread(null); } });
    
    if (selectedConf) {
      breadcrumbs.push({ 
        name: selectedConf.name, 
        onClick: () => { setSelectedThread(null); setFullWidthThread(false); } 
      });
      
      if (selectedThread) {
        breadcrumbs.push({ 
          name: selectedThread.root.subject, 
          onClick: null 
        });
      }
    }
    
    return breadcrumbs;
  };
  
  const toggleDetailsView = () => {
    setDetailsVisible(!detailsVisible);
  };
  
  const toggleFullWidth = () => {
    setFullWidthThread(!fullWidthThread);
  };

  return (
    <div className="w-full mx-auto p-4">
      {/* Header */}
      <div className="bg-blue-800 text-white p-4 rounded-t-lg shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">QWK Mail Reader</h1>
            {bbsInfo && (
              <div className="text-sm">
                {bbsInfo.name} - {bbsInfo.location} - {bbsInfo.packetDate}
              </div>
            )}
            {bbsInfo && (
              <div className="text-sm">
                User: {bbsInfo.username}
              </div>
            )}
          </div>
          
          {/* File upload */}
          <div>
            <input
              type="file"
              id="fileUpload"
              multiple
              onChange={handleFilesUpload}
              className="hidden"
            />
            <label 
              htmlFor="fileUpload" 
              className="bg-white text-blue-800 px-4 py-2 rounded cursor-pointer hover:bg-blue-100"
            >
              Load QWK Files
            </label>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        {conferences.length > 0 && (
          <div className="flex items-center mt-4 text-sm">
            {getBreadcrumbs().map((crumb, idx, arr) => (
              <React.Fragment key={idx}>
                <button 
                  onClick={crumb.onClick} 
                  className={`hover:underline flex items-center ${crumb.onClick ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {idx === 0 && <Home className="w-4 h-4 mr-1" />}
                  {crumb.name}
                </button>
                {idx < arr.length - 1 && <ChevronRight className="mx-2 w-4 h-4" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      )}
      
      {/* Main content */}
      <div className="bg-white rounded-b-lg shadow-md p-4" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {conferences.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No QWK files loaded</h2>
            <p>Please click "Load QWK Files" to get started</p>
          </div>
        ) : !selectedConf ? (
          /* Conference list view */
          <div className="flex-grow overflow-hidden flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Conferences</h2>
            <div className="rounded border overflow-auto flex-grow">
              <table className="w-full">
                <thead className="sticky top-0 bg-blue-700 text-white">
                  <tr>
                    <th className="p-3 text-left">Conference</th>
                    <th className="p-3 text-right">Messages</th>
                    <th className="p-3 text-right">Last Post</th>
                  </tr>
                </thead>
                <tbody>
                  {conferences.map((conf, idx) => (
                    <tr 
                      key={conf.number} 
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                      onClick={() => setSelectedConf(conf)}
                    >
                      <td className="p-3 font-medium">{conf.name}</td>
                      <td className="p-3 text-right">{conf.messageCount} in {conf.displayThreads.length} threads</td>
                      <td className="p-3 text-right">{formatDate(conf.newestDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Thread and message view */
          <div className="flex h-full">
            {/* Thread list */}
            {!fullWidthThread && (
              <div className={`${detailsVisible ? 'w-1/3' : 'flex-1'} pr-4 flex flex-col h-full`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <button 
                      onClick={() => { setSelectedConf(null); setSelectedThread(null); }}
                      className="p-2 mr-2 rounded hover:bg-gray-200"
                      title="Back to conferences"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-semibold">{selectedConf.name} Threads</h2>
                  </div>
                  
                  {detailsVisible && (
                    <button 
                      onClick={toggleDetailsView}
                      className="p-2 rounded hover:bg-gray-100"
                      title="Hide details"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="rounded border overflow-auto flex-grow">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-blue-700 text-white">
                      <tr>
                        <th className="p-3 text-left">Subject</th>
                        <th className="p-3 text-right">Replies</th>
                        <th className="p-3 text-right">Latest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedConf.displayThreads.map((thread, idx) => (
                        <tr 
                          key={idx} 
                          className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                      ${selectedThread === thread ? 'bg-blue-100' : 'hover:bg-blue-50'} 
                                      cursor-pointer`}
                          onClick={() => {
                            setSelectedThread(thread);
                            if (!detailsVisible) {
                              // If details are hidden, single click goes to full view
                              setFullWidthThread(true);
                            }
                          }}
                          onDoubleClick={() => {
                            setSelectedThread(thread);
                            toggleFullWidth();
                          }}
                        >
                          <td className="p-3">
                            <div className="font-medium">{thread.root.subject}</div>
                            <div className="text-sm text-gray-500">From: {thread.root.from}</div>
                          </td>
                          <td className="p-3 text-right">{thread.replies.length}</td>
                          <td className="p-3 text-right">
                            {thread.replies.length > 0 ? 
                              formatDate(parseDate(thread.replies[thread.replies.length - 1])) : 
                              formatDate(parseDate(thread.root))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Message details */}
            {(detailsVisible || fullWidthThread) && selectedThread && (
              <div className={`${fullWidthThread ? 'flex-1' : 'w-2/3'} flex flex-col h-full`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    {fullWidthThread && (
                      <button 
                        onClick={() => { setFullWidthThread(false); }}
                        className="p-2 mr-2 rounded hover:bg-gray-200"
                        title="Back to thread list"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    <h2 className="text-xl font-semibold truncate">{selectedThread.root.subject}</h2>
                  </div>
                  
                  <div className="flex">
                    {!detailsVisible && !fullWidthThread && (
                      <button 
                        onClick={toggleDetailsView}
                        className="p-2 rounded hover:bg-gray-100 mr-2"
                        title="Show thread list"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button 
                      onClick={toggleFullWidth}
                      className="p-2 rounded hover:bg-gray-100"
                      title={fullWidthThread ? "Normal view" : "Full width view"}
                    >
                      {fullWidthThread ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4 overflow-auto flex-grow">
                  {/* Root message */}
                  <div className="bg-white p-4 rounded border shadow-sm">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="font-bold">{selectedThread.root.from}</span> &raquo; <span>{selectedThread.root.to}</span>
                      </div>
                      <div className="text-gray-500">{formatDate(parseDate(selectedThread.root))}</div>
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      Message #{selectedThread.root.number}
                      {selectedThread.root.replyTo && selectedThread.root.replyTo.trim() !== '' && selectedThread.root.replyTo.trim() !== '0' && (
                        <span> in reply to #{selectedThread.root.replyTo}</span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border">
                      {selectedThread.root.body}
                    </div>
                  </div>
                  
                  {/* Replies */}
                  {selectedThread.replies.map((reply, idx) => (
                    <div 
                      key={idx} 
                      className={`${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} p-4 rounded border shadow-sm`}
                    >
                      <div className="flex justify-between mb-2">
                        <div>
                          <span className="font-bold">{reply.from}</span> &raquo; <span>{reply.to}</span>
                        </div>
                        <div className="text-gray-500">{formatDate(parseDate(reply))}</div>
                      </div>
                      <div className="mb-2 text-sm text-gray-600">
                        Message #{reply.number} in reply to #{reply.replyTo}
                      </div>
                      <div className="whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border">
                        {reply.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QWKReader;
